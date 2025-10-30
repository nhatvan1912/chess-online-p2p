const RoomService = require('../../services/RoomService');
const GameService = require('../../services/GameService');
const RoomDAO = require('../../dao/RoomDAO');

class RoomHandler {
  // Cập nhật trạng thái ready
  async updateReady(playerId, roomId, isReady, wsServer) {
    try {
      const result = await RoomService.updateReadyStatus(roomId, playerId, isReady);
      
      if (result.success) {
        const room = result.room;
        
        // Gửi update cho cả 2 players trong phòng
        const playerIds = [room.host_player_id, room.guest_player_id].filter(id => id);
        
        wsServer.sendToPlayers(playerIds, {
          type: 'room_updated',
          room: room
        });
      }
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Bắt đầu game
  async startGame(playerId, roomId, wsServer) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }

      // Kiểm tra player có phải host không
      if (room.host_player_id !== playerId) {
        throw new Error('Chỉ host mới có thể bắt đầu game');
      }

      // Kiểm tra điều kiện bắt đầu
      const canStart = await RoomService.canStartGame(roomId);
      if (!canStart.canStart) {
        throw new Error(canStart.message);
      }

      // Tạo game
      const gameData = {
        game_mode: room.room_mode,
        room_id: roomId,
        player1_id: room.host_player_id,
        player2_id: room.guest_player_id,
        is_ranked: false
      };

      const game = await GameService.createGame(gameData);

      // Gửi thông báo game started
      const gameInfo = {
        type: 'game_started',
        gameId: game.gameId,
        roomId: roomId,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        isRanked: false,
        gameMode: room.room_mode,
        timeSettings: {
          time_initial_sec: room.time_initial_sec,
          per_move_max_sec: room.per_move_max_sec,
          increment_sec: room.increment_sec
        }
      };

      wsServer.sendToPlayer(room.host_player_id, gameInfo);
      wsServer.sendToPlayer(room.guest_player_id, gameInfo);
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Mời player vào phòng
  invitePlayer(playerId, targetPlayerId, roomId, wsServer) {
    try {
      // Gửi lời mời đến target player
      wsServer.sendToPlayer(targetPlayerId, {
        type: 'room_invitation',
        roomId: roomId,
        fromPlayerId: playerId
      });

      wsServer.sendToPlayer(playerId, {
        type: 'invitation_sent',
        message: 'Đã gửi lời mời'
      });
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Broadcast room list update
  broadcastRoomListUpdate(wsServer) {
    RoomService.getWaitingRooms()
      .then(result => {
        wsServer.broadcast({
          type: 'room_list_updated',
          rooms: result.rooms
        });
      })
      .catch(error => {
        console.error('Error broadcasting room list:', error);
      });
  }
}

module.exports = new RoomHandler();
