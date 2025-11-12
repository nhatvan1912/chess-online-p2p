const RoomDAO = require('../dao/RoomDAO');
const bcrypt = require('bcrypt');

class RoomService {
  async createRoom(roomData) {
    try {
      // if (roomData.room_type === 'private' && roomData.password) {
      //   const saltRounds = 10;
      //   roomData.password = await bcrypt.hash(roomData.password, saltRounds);
      // }

      const result = await RoomDAO.createRoom(roomData);
      const room = await RoomDAO.getRoomById(result.id);
      
      return {
        success: true,
        room,
        message: 'Tạo phòng thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async getWaitingRooms() {
    try {
      const rooms = await RoomDAO.getWaitingRooms();
      return {
        success: true,
        rooms
      };
    } catch (error) {
      throw error;
    }
  }

  async joinRoom(roomId, playerId) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }

      if (room.status !== 'waiting') {
        throw new Error('Phòng đã bắt đầu hoặc đã kết thúc');
      }

      await RoomDAO.joinRoom(roomId, playerId);
      const updatedRoom = await RoomDAO.getRoomById(roomId);

      return {
        success: true,
        room: updatedRoom,
        message: 'Tham gia phòng thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async leaveRoom(roomId, playerId) {
    try {
      const result = await RoomDAO.leaveRoom(roomId, playerId);
      return {
        success: true,  
        deleteRoom: result,
        message: 'Rời phòng thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateReadyStatus(roomId, playerId, isReady) {
    try {
      await RoomDAO.updateReadyStatus(roomId, playerId, isReady);
      const room = await RoomDAO.getRoomById(roomId);
      
      return {
        success: true,
        room,
        message: 'Cập nhật trạng thái thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async canStartGame(roomId) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      
      if (!room) {
        return { canStart: false, message: 'Phòng không tồn tại' };
      }

      if (!room.host_player_id || !room.guest_player_id) {
        return { canStart: false, message: 'Chưa đủ người chơi' };
      }

      if (!room.host_ready || !room.guest_ready) {
        return { canStart: false, message: 'Chưa cả hai người chơi sẵn sàng' };
      }

      return { canStart: true };
    } catch (error) {
      throw error;
    }
  }

  async getRoomInfo(roomId) {
    try {
      const room = await RoomDAO.getRoomById(roomId);
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }
      return { success: true, room };
    } catch (error) {
      throw error;
    }
  }

  async getPlayerRoom(playerId) {
    try {
      const room = await RoomDAO.getRoomByPlayerId(playerId);
      return { success: true, room };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoomService();
