const RoomService = require('../../services/RoomService');
const GameService = require('../../services/GameService');
const RoomDAO = require('../../dao/RoomDAO');
const PlayerDAO = require('../../dao/PlayerDAO');
const bcrypt = require('bcrypt');

class RoomHandler {
  constructor() {
    // Map: roomId -> Set(requesterIds)
    this.pendingRequests = new Map();
  }

  // ================== READY / START GAME (giữ nguyên) ==================
  async updateReady(playerId, roomId, isReady, wsServer) {
    try {
      const result = await RoomService.updateReadyStatus(roomId, playerId, isReady);
      if (result.success) {
        const room = result.room;
        const playerIds = [room.host_player_id, room.guest_player_id].filter(Boolean);
        wsServer.sendToPlayers(playerIds, { type: 'room_updated', room });
      }
    } catch (error) {
      wsServer.sendToPlayer(playerId, { type: 'error', message: error.message });
    }
  }

  async startGame(playerId, roomId, wsServer) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      if (!room) throw new Error('Phòng không tồn tại');
      if (room.host_player_id !== playerId) throw new Error('Chỉ host mới có thể bắt đầu game');

      const canStart = await RoomService.canStartGame(roomId);
      if (!canStart.canStart) throw new Error(canStart.message);

      const gameData = {
        game_mode: room.room_mode,
        room_id: roomId,
        player1_id: room.host_player_id,
        player2_id: room.guest_player_id,
        is_ranked: false
      };

      const game = await GameService.createGame(gameData);

      const gameInfo = {
        type: 'game_started',
        gameId: game.gameId,
        roomId,
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
      wsServer.sendToPlayer(playerId, { type: 'error', message: error.message });
    }
  }

  async invitePlayer(playerId, targetPlayerId, roomId, wsServer) {
    try {
      const result = await RoomService.getRoomInfo(roomId);
      wsServer.sendToPlayer(targetPlayerId, {
        type: 'room_invitation',
        roomId,
        roomPassword: result.room.password,
        fromPlayerId: playerId
      });
      wsServer.sendToPlayer(playerId, { type: 'invitation_sent', message: 'Đã gửi lời mời' });
    } catch (error) {
      wsServer.sendToPlayer(playerId, { type: 'error', message: error.message });
    }
  }

  async handleUpdateUI(playerId, roomId, wsServer) {
    try {
      const result = await RoomService.getRoomInfo(roomId);
      if (result.success) {
        const room = result.room;
        const opponentID =
          room.host_player_id === playerId ? room.guest_player_id : room.host_player_id;
        if (opponentID) {
          wsServer.sendToPlayer(opponentID, {
            type: 'update_UI',
            roomId,
            message: 'Cập nhật giao diện phòng'
          });
        }
      }
    } catch (error) {
      wsServer.sendToPlayer(playerId, { type: 'error', message: error.message });
    }
  }

  async leaveRoom(playerId, roomId, wsServer) {
    try {
      const result = await RoomService.leaveRoom(roomId, playerId);
      if (result.success && !result.deleteRoom) {
        await this.handleUpdateUI(playerId, roomId, wsServer);
      }
    } catch (error) {
      wsServer.sendToPlayer(playerId, { type: 'error', message: error.message });
    }
  }

  broadcastRoomListUpdate(wsServer) {
    RoomService.getWaitingRooms()
      .then(result => {
        wsServer.broadcast({ type: 'room_list_updated', rooms: result.rooms });
      })
      .catch(error => {
        console.error('Error broadcasting room list:', error);
      });
  }

  async requestJoinRoom(requesterId, roomId, password, wsServer) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      if (!room) throw new Error('Phòng không tồn tại');
      if (room.status !== 'waiting') throw new Error('Phòng không ở trạng thái chờ');
      if (!room.host_player_id) throw new Error('Phòng không có host');
      if (room.guest_player_id) throw new Error('Phòng đã có đủ người');

      if (room.room_type === 'private') {
        if (!password) throw new Error('Phòng riêng tư yêu cầu mật khẩu');
        const ok = String(password) === room.password ;
        if (!ok) throw new Error('Mật khẩu không đúng');
      }

      if (!this.pendingRequests.has(roomId)) {
        this.pendingRequests.set(roomId, new Set());
      }
      const setReq = this.pendingRequests.get(roomId);

      if (!setReq.has(requesterId)) {
        setReq.add(requesterId);
      }

      const requester = await PlayerDAO.getPlayerById(requesterId);

      wsServer.sendToPlayer(room.host_player_id, {
        type: 'room_join_request',
        roomId,
        requesterId,
        requesterName: requester.displayname || requester.username
      });

      wsServer.sendToPlayer(requesterId, {
        type: 'join_request_sent',
        roomId,
        message: 'Đã gửi yêu cầu, chờ host chấp nhận'
      });

    } catch (error) {
      wsServer.sendToPlayer(requesterId, { type: 'error', message: error.message });
    }
  }

  async approveJoinRoom(hostId, roomId, requesterId, wsServer) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      if (!room) throw new Error('Phòng không tồn tại');
      if (room.host_player_id !== hostId) throw new Error('Chỉ host mới chấp nhận');
      if (room.guest_player_id) throw new Error('Phòng đã có khách');

      const setReq = this.pendingRequests.get(roomId);
      if (!setReq || !setReq.has(requesterId)) {
        throw new Error('Không tìm thấy yêu cầu của người chơi này');
      }

      await RoomDAO.joinRoom(roomId, requesterId);

      const updated = await RoomDAO.getRoomById(roomId);
      wsServer.sendToPlayers(
        [updated.host_player_id, updated.guest_player_id].filter(Boolean),
        { type: 'room_updated', room: updated }
      );

      wsServer.sendToPlayer(requesterId, {
        type: 'join_approved',
        roomId,
        message: 'Host đã chấp nhận bạn vào phòng'
      });
      wsServer.sendToPlayer(hostId, {
        type: 'join_approval_done',
        roomId,
        message: 'Đã chấp nhận người chơi'
      });

      for (const otherId of setReq) {
        if (otherId !== requesterId) {
          wsServer.sendToPlayer(otherId, {
            type: 'join_rejected',
            roomId,
            reason: 'Host đã chọn người khác'
          });
        }
      }

      this.pendingRequests.delete(roomId);
      this.broadcastRoomListUpdate(wsServer);

    } catch (error) {
      wsServer.sendToPlayer(hostId, { type: 'error', message: error.message });
    }
  }

  async rejectJoinRoom(hostId, roomId, requesterId, wsServer) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      if (!room) throw new Error('Phòng không tồn tại');
      if (room.host_player_id !== hostId) throw new Error('Chỉ host mới từ chối');

      const setReq = this.pendingRequests.get(roomId);
      if (!setReq || !setReq.has(requesterId)) {
        throw new Error('Không tìm thấy yêu cầu của người chơi này');
      }

      setReq.delete(requesterId);
      if (setReq.size === 0) {
        this.pendingRequests.delete(roomId);
      }

      wsServer.sendToPlayer(requesterId, {
        type: 'join_rejected',
        roomId,
        reason: 'Host đã từ chối'
      });
      wsServer.sendToPlayer(hostId, {
        type: 'join_rejection_done',
        roomId,
        message: 'Đã từ chối yêu cầu'
      });

    } catch (error) {
      wsServer.sendToPlayer(hostId, { type: 'error', message: error.message });
    }
  }
}

module.exports = new RoomHandler();