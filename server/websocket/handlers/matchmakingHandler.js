const MatchmakingService = require('../../services/MatchmakingService');
const GameService = require('../../services/GameService');
const RoomDAO = require('../../dao/RoomDAO');

class MatchmakingHandler {
  constructor() {
    // Clean up expired matches mỗi 10 giây
    setInterval(() => {
      MatchmakingService.cleanupExpiredMatches();
    }, 10000);
  }

  // Player tham gia queue matchmaking
  async joinQueue(playerId, wsServer) {
    try {
      // Thêm vào queue
      const match = await MatchmakingService.addToQueue(playerId);

      if (match) {
        // Tìm thấy match ngay lập tức
        const { matchId, player1Id, player2Id } = match;
        
        // Gửi thông báo match found cho cả 2 players
        wsServer.sendToPlayer(player1Id, {
          type: 'match_found',
          matchId,
          opponentId: player2Id
        });

        wsServer.sendToPlayer(player2Id, {
          type: 'match_found',
          matchId,
          opponentId: player1Id
        });
      } else {
        // Vào queue chờ
        wsServer.sendToPlayer(playerId, {
          type: 'matchmaking_joined',
          message: 'Đang tìm đối thủ...',
          queueSize: MatchmakingService.getQueueSize()
        });
      }
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Player rời queue
  leaveQueue(playerId, wsServer) {
    MatchmakingService.removeFromQueue(playerId);
    wsServer.sendToPlayer(playerId, {
      type: 'matchmaking_left',
      message: 'Đã rời khỏi hàng chờ'
    });
  }

  // Player accept match
  async acceptMatch(playerId, matchId, wsServer) {
    try {
      const result = MatchmakingService.acceptMatch(matchId, playerId);
      
      if (!result) {
        wsServer.sendToPlayer(playerId, {
          type: 'error',
          message: 'Match không tồn tại hoặc đã hết hạn'
        });
        return;
      }

      if (result.ready) {
        // Cả 2 đã accept, tạo game
        const { player1Id, player2Id } = result;

        // Tạo room tự động cho ranked match
        const roomData = {
          room_name: 'Ranked Match',
          room_type: 'public',
          room_mode: 'normal',
          host_player_id: player1Id
        };
        const roomResult = await RoomDAO.createRoom(roomData);
        await RoomDAO.joinRoom(roomResult.id, player2Id);
        await RoomDAO.updateRoomStatus(roomResult.id, 'playing');

        // Tạo game
        const gameData = {
          game_mode: 'normal',
          room_id: roomResult.id,
          player1_id: player1Id,
          player2_id: player2Id,
          is_ranked: true
        };

        const game = await GameService.createGame(gameData);

        // Gửi thông báo game started cho cả 2 players
        const gameInfo = {
          type: 'game_started',
          gameId: game.gameId,
          roomId: roomResult.id,
          whitePlayerId: game.whitePlayerId,
          blackPlayerId: game.blackPlayerId,
          isRanked: true
        };

        wsServer.sendToPlayer(player1Id, gameInfo);
        wsServer.sendToPlayer(player2Id, gameInfo);
      } else {
        // Chờ player kia accept
        wsServer.sendToPlayer(playerId, {
          type: 'match_accepted',
          message: 'Đang chờ đối thủ chấp nhận...'
        });
      }
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Player decline match
  declineMatch(playerId, matchId, wsServer) {
    try {
      MatchmakingService.declineMatch(matchId, playerId);
      
      wsServer.sendToPlayer(playerId, {
        type: 'match_declined',
        message: 'Đã từ chối match'
      });
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }
}

module.exports = new MatchmakingHandler();
