const pool = require('../config/database');

class PlayerStatsDAO {
  // Lấy thống kê player
  async getPlayerStats(playerId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblPlayerStats WHERE player_id = ?',
        [playerId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật điểm và thống kê sau khi game kết thúc
  async updateStats(playerId, result, pointChange) {
    try {
      let updateQuery = '';
      
      if (result === 'win') {
        updateQuery = `
          UPDATE tblPlayerStats 
          SET games_played = games_played + 1,
              wins = wins + 1,
              point = point + ?
          WHERE player_id = ?
        `;
      } else if (result === 'loss') {
        updateQuery = `
          UPDATE tblPlayerStats 
          SET games_played = games_played + 1,
              losses = losses + 1,
              point = point + ?
          WHERE player_id = ?
        `;
      } else if (result === 'draw') {
        updateQuery = `
          UPDATE tblPlayerStats 
          SET games_played = games_played + 1,
              draws = draws + 1,
              point = point + ?
          WHERE player_id = ?
        `;
      }
      
      await pool.execute(updateQuery, [pointChange, playerId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy bảng xếp hạng
  async getLeaderboard(limit = 10) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.player_id, p.username, p.displayname, 
                ps.point, ps.games_played, ps.wins, ps.losses, ps.draws
         FROM tblPlayerStats ps
         JOIN tblPlayer p ON ps.player_id = p.player_id
         ORDER BY ps.point DESC, ps.wins DESC
         LIMIT ?`,
        [limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê kèm thông tin player
  async getPlayerStatsWithInfo(playerId) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.player_id, p.username, p.displayname,
                ps.games_played, ps.point, ps.wins, ps.losses, ps.draws
         FROM tblPlayerStats ps
         JOIN tblPlayer p ON ps.player_id = p.player_id
         WHERE p.player_id = ?`,
        [playerId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Reset thống kê player (dùng cho testing hoặc reset season)
  async resetStats(playerId) {
    try {
      await pool.execute(
        `UPDATE tblPlayerStats 
         SET games_played = 0, point = 0, wins = 0, losses = 0, draws = 0
         WHERE player_id = ?`,
        [playerId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PlayerStatsDAO();
