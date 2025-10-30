const pool = require('../config/database');

class GameDAO {
  // Tạo game mới
  async createGame(gameData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO tblGame (game_mode, room_id, white_player_id, black_player_id, is_ranked)
         VALUES (?, ?, ?, ?, ?)`,
        [
          gameData.game_mode || 'normal',
          gameData.room_id || null,
          gameData.white_player_id,
          gameData.black_player_id,
          gameData.is_ranked ? 1 : 0
        ]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin game theo ID
  async getGameById(gameId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblGame WHERE game_id = ?',
        [gameId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy game theo room ID
  async getGameByRoomId(roomId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblGame WHERE room_id = ? ORDER BY start_time DESC LIMIT 1',
        [roomId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái game
  async updateGameStatus(gameId, status) {
    try {
      await pool.execute(
        'UPDATE tblGame SET status = ? WHERE game_id = ?',
        [status, gameId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Kết thúc game và cập nhật kết quả
  async endGame(gameId, result, whitePointChange, blackPointChange) {
    try {
      await pool.execute(
        `UPDATE tblGame 
         SET status = 'finished', result = ?, 
             white_point_change = ?, black_point_change = ?,
             end_time = NOW()
         WHERE game_id = ?`,
        [result, whitePointChange, blackPointChange, gameId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử game của player
  async getPlayerGameHistory(playerId, limit = 10) {
    try {
      const [rows] = await pool.execute(
        `SELECT g.*, 
                wp.username as white_username, wp.displayname as white_displayname,
                bp.username as black_username, bp.displayname as black_displayname
         FROM tblGame g
         LEFT JOIN tblPlayer wp ON g.white_player_id = wp.player_id
         LEFT JOIN tblPlayer bp ON g.black_player_id = bp.player_id
         WHERE g.white_player_id = ? OR g.black_player_id = ?
         ORDER BY g.start_time DESC
         LIMIT ?`,
        [playerId, playerId, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê game theo player
  async getPlayerGameStats(playerId) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          COUNT(*) as total_games,
          SUM(CASE WHEN (white_player_id = ? AND result = 'white_win') 
                     OR (black_player_id = ? AND result = 'black_win') THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN (white_player_id = ? AND result = 'black_win') 
                     OR (black_player_id = ? AND result = 'white_win') THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws
         FROM tblGame
         WHERE (white_player_id = ? OR black_player_id = ?) AND status = 'finished'`,
        [playerId, playerId, playerId, playerId, playerId, playerId]
      );
      return rows[0] || { total_games: 0, wins: 0, losses: 0, draws: 0 };
    } catch (error) {
      throw error;
    }
  }

  // Lấy game đang chơi của player
  async getActiveGame(playerId) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM tblGame 
         WHERE (white_player_id = ? OR black_player_id = ?) 
         AND status = 'playing'
         ORDER BY start_time DESC LIMIT 1`,
        [playerId, playerId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Xóa game
  async deleteGame(gameId) {
    try {
      await pool.execute('DELETE FROM tblGame WHERE game_id = ?', [gameId]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new GameDAO();
