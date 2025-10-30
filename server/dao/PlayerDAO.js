const pool = require('../config/database');

class PlayerDAO {
  // Tạo player mới
  async createPlayer(username, passwordHash, email, displayname = null) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO tblPlayer (username, password_hash, email, displayname) VALUES (?, ?, ?, ?)',
        [username, passwordHash, email, displayname || username]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Lấy player theo username
  async getPlayerByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblPlayer WHERE username = ?',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy player theo email
  async getPlayerByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblPlayer WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy player theo ID
  async getPlayerById(playerId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblPlayer WHERE player_id = ?',
        [playerId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái player
  async updatePlayerStatus(playerId, status) {
    try {
      await pool.execute(
        'UPDATE tblPlayer SET status = ? WHERE player_id = ?',
        [status, playerId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách player online
  async getOnlinePlayers() {
    try {
      const [rows] = await pool.execute(
        'SELECT player_id, username, displayname, status FROM tblPlayer WHERE status = ?',
        ['online']
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin player
  async updatePlayer(playerId, updates) {
    try {
      const fields = [];
      const values = [];
      
      if (updates.displayname !== undefined) {
        fields.push('displayname = ?');
        values.push(updates.displayname);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      
      if (fields.length === 0) return false;
      
      values.push(playerId);
      const query = `UPDATE tblPlayer SET ${fields.join(', ')} WHERE player_id = ?`;
      
      await pool.execute(query, values);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Xóa player
  async deletePlayer(playerId) {
    try {
      await pool.execute(
        'DELETE FROM tblPlayer WHERE player_id = ?',
        [playerId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PlayerDAO();
