const WebSocket = require('ws');
const url = require('url');
const matchmakingHandler = require('./handlers/matchmakingHandler');
const roomHandler = require('./handlers/roomHandler');
const gameHandler = require('./handlers/gameHandler');
const PlayerDAO = require('../dao/PlayerDAO');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // playerId -> ws
    this.disconnectGraceTimers = new Map(); // playerId -> timeoutId
    this.graceMs = parseInt(process.env.WS_DISCONNECT_GRACE_MS || '5000', 10);

    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const params = url.parse(req.url, true).query;
      const playerId = parseInt(params.playerId, 10);

      if (!playerId) {
        ws.close();
        return;
      }

      const pendingTimer = this.disconnectGraceTimers.get(playerId);
      const isReconnectWithinGrace = !!pendingTimer;
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        this.disconnectGraceTimers.delete(playerId);
      }
      const oldWs = this.clients.get(playerId);
      if (oldWs && oldWs !== ws) {
        try {
          oldWs.terminate();
        } catch (e) {
          // ignore
        }
      }

      this.clients.set(playerId, ws);

      if (!isReconnectWithinGrace) {
        console.log(`Player ${playerId} connected to WebSocket`);
      }

      this.handleConnect(playerId);
      this.sendToPlayer(playerId, {
        type: 'connected',
        message: 'Kết nối WebSocket thành công'
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(playerId, data);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          this.sendToPlayer(playerId, {
            type: 'error',
            message: error.message
          });
        }
      });

      ws.on('close', () => {
        const storedWs = this.clients.get(playerId);
        if (storedWs && storedWs !== ws) {
          return;
        }
        const t = setTimeout(async () => {
          const currentWs = this.clients.get(playerId);
          if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            this.disconnectGraceTimers.delete(playerId);
            return;
          }

          console.log(`Player ${playerId} disconnected from WebSocket`);
          this.clients.delete(playerId);
          this.disconnectGraceTimers.delete(playerId);

          try {
            this.handleDisconnect(playerId);
          } catch (err) {
            console.error('Error in handleDisconnect:', err);
          }
        }, this.graceMs);

        this.disconnectGraceTimers.set(playerId, t);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for player ${playerId}:`, error);
      });
    });
  }

  async handleMessage(playerId, data) {
    const { type, payload } = data;

    switch (type) {
      // Matchmaking
      case 'join_matchmaking':
        await matchmakingHandler.joinQueue(playerId, this);
        break;
      case 'leave_matchmaking':
        matchmakingHandler.leaveQueue(playerId, this);
        break;
      case 'accept_match':
        await matchmakingHandler.acceptMatch(playerId, payload.matchId, this);
        break;
      case 'decline_match':
        matchmakingHandler.declineMatch(playerId, payload.matchId, this);
        break;

      // Room
      case 'room_ready':
        await roomHandler.updateReady(playerId, payload.roomId, payload.isReady, this);
        break;
      case 'start_game':
        await roomHandler.startGame(playerId, payload.roomId, this);
        break;
      case 'invite_player':
        roomHandler.invitePlayer(playerId, payload.targetPlayerId, payload.roomId, this);
        break;
      case 'join_success':
        await roomHandler.handleUpdateUI(playerId, payload.roomId, this);
        break;
      case 'leave_room':
        await roomHandler.leaveRoom(playerId, payload.roomId, this);
        break;

      // Game
      case 'make_move':
        await gameHandler.makeMove(playerId, payload, this);
        break;
      case 'offer_draw':
        gameHandler.offerDraw(playerId, payload.gameId, this);
        break;
      case 'accept_draw':
        await gameHandler.acceptDraw(playerId, payload.gameId, this);
        break;
      case 'resign':
        await gameHandler.resign(playerId, payload.gameId, this);
        break;
      case 'chat_message':
        gameHandler.sendChatMessage(playerId, payload, this);
        break;
      case 'game_end':
        gameHandler.handleGameEnd(payload.gameId, payload.result, this);
        break;

      default:
        console.log(`⚠️ Unknown message type: ${type}`);
    }
  }

  handleDisconnect(playerId) {
    try {
      matchmakingHandler.leaveQueue(playerId, this);
    } catch (err) {
      console.error('Error leaving matchmaking on disconnect:', err);
    }

    try {
      PlayerDAO.updatePlayerStatus(playerId, 'offline');
    } catch (err) {
      console.error('Error updating player status to offline:', err);
    }
  }

  handleConnect(playerId) {
    try {
      // If there was a grace timer scheduled for this player, clear it (reconnect).
      const pending = this.disconnectGraceTimers.get(playerId);
      if (pending) {
        clearTimeout(pending);
        this.disconnectGraceTimers.delete(playerId);
        console.log(`✅ Cleared pending disconnect timer for player ${playerId} on connect`);
      }

      PlayerDAO.updatePlayerStatus(playerId, 'online');
    } catch (err) {
      console.error('Error updating player status to online:', err);
    }
  }

  sendToPlayer(playerId, data) {
    const ws = this.clients.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // Gửi message đến nhiều players
  sendToPlayers(playerIds, data) {
    playerIds.forEach(playerId => {
      this.sendToPlayer(playerId, data);
    });
  }

  // Broadcast đến tất cả clients
  broadcast(data) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  // Kiểm tra player có online không
  isPlayerOnline(playerId) {
    return this.clients.has(playerId);
  }

  // Lấy danh sách player online
  getOnlinePlayers() {
    return Array.from(this.clients.keys());
  }
}
module.exports = WebSocketServer;