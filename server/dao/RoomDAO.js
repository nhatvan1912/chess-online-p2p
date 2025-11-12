const pool = require('../config/database');

class RoomDAO {
  // Tạo mã phòng ngẫu nhiên (6 ký tự alphanumeric)
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Tạo phòng mới
  async createRoom(roomData) {
    try {
      const roomCode = this.generateRoomCode();
      const [result] = await pool.execute(
        `INSERT INTO tblRoom (room_code, room_name, room_type, room_mode, password, 
                              time_initial_sec, per_move_max_sec, increment_sec, host_player_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          roomCode,
          roomData.room_name || 'New Room',
          roomData.room_type || 'public',
          roomData.room_mode || 'normal',
          roomData.password || null,
          roomData.time_initial_sec || null,
          roomData.per_move_max_sec || null,
          roomData.increment_sec || null,
          roomData.host_player_id
        ]
      );
      return { id: result.insertId, room_code: roomCode };
    } catch (error) {
      // Nếu trùng room_code, thử lại
      if (error.code === 'ER_DUP_ENTRY') {
        return this.createRoom(roomData);
      }
      throw error;
    }
  }

  // Lấy thông tin phòng theo ID
  async getRoomById(roomId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblRoom WHERE id = ?',
        [roomId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin phòng theo room_code
  async getRoomByCode(roomCode) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblRoom WHERE room_code = ?',
        [roomCode]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách phòng đang chờ
  async getWaitingRooms() {
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, 
                hp.username as host_username, hp.displayname as host_displayname,
                gp.username as guest_username, gp.displayname as guest_displayname
         FROM tblRoom r
         LEFT JOIN tblPlayer hp ON r.host_player_id = hp.player_id
         LEFT JOIN tblPlayer gp ON r.guest_player_id = gp.player_id
         WHERE r.status = ?
         ORDER BY r.created_at DESC`,
        ['waiting']
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Player tham gia phòng
  async joinRoom(roomId, playerId) {
    try {
      await pool.execute(
        'UPDATE tblRoom SET guest_player_id = ? WHERE id = ? AND guest_player_id IS NULL',
        [playerId, roomId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Player rời phòng
  async leaveRoom(roomId, playerId) {
    try {
      // Kiểm tra xem player là host hay guest
      const room = await this.getRoomById(roomId);
      let deleteRoom = false;
      if (!room) return false;

      if (room.host_player_id === playerId) {
        // Nếu là host, xóa phòng hoặc chuyển guest thành host
        if (room.guest_player_id) {
          await pool.execute(
            'UPDATE tblRoom SET host_player_id = ?, guest_player_id = NULL, host_ready = 0, guest_ready = 0 WHERE id = ?',
            [room.guest_player_id, roomId]
          );
        } else {
          await pool.execute('DELETE FROM tblRoom WHERE id = ?', [roomId]);
          deleteRoom = true;
        }
      } else if (room.guest_player_id === playerId) {
        // Nếu là guest, set guest_player_id về NULL
        await pool.execute(
          'UPDATE tblRoom SET guest_player_id = NULL, guest_ready = 0 WHERE id = ?',
          [roomId]
        );
      }
      return deleteRoom;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái sẵn sàng
  async updateReadyStatus(roomId, playerId, isReady) {
    try {
      const room = await this.getRoomById(roomId);
      if (!room) return false;

      if (room.host_player_id === playerId) {
        await pool.execute(
          'UPDATE tblRoom SET host_ready = ? WHERE id = ?',
          [isReady ? 1 : 0, roomId]
        );
      } else if (room.guest_player_id === playerId) {
        await pool.execute(
          'UPDATE tblRoom SET guest_ready = ? WHERE id = ?',
          [isReady ? 1 : 0, roomId]
        );
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái phòng
  async updateRoomStatus(roomId, status) {
    try {
      await pool.execute(
        'UPDATE tblRoom SET status = ? WHERE id = ?',
        [status, roomId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Xóa phòng
  async deleteRoom(roomId) {
    try {
      await pool.execute('DELETE FROM tblRoom WHERE id = ?', [roomId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy phòng của player
  async getRoomByPlayerId(playerId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM tblRoom 
         WHERE (host_player_id = ? OR guest_player_id = ?) 
         AND status IN ('waiting', 'playing')`,
        [playerId, playerId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoomDAO();
