const pool = require('../config/database');

class GameMoveDAO {
  // Lưu nước đi
  async createMove(moveData) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO tblGamemove (game_id, move_number, player_color, move_notation, board_state_fen)
         VALUES (?, ?, ?, ?, ?)`,
        [
          moveData.game_id,
          moveData.move_number,
          moveData.player_color,
          moveData.move_notation,
          moveData.board_state_fen
        ]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả nước đi của game
  async getMovesByGameId(gameId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblGamemove WHERE game_id = ? ORDER BY move_number ASC',
        [gameId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy nước đi cuối cùng
  async getLastMove(gameId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblGamemove WHERE game_id = ? ORDER BY move_number DESC LIMIT 1',
        [gameId]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy nước đi theo số thứ tự
  async getMoveByNumber(gameId, moveNumber) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM tblGamemove WHERE game_id = ? AND move_number = ?',
        [gameId, moveNumber]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Đếm số lượng nước đi
  async countMoves(gameId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM tblGamemove WHERE game_id = ?',
        [gameId]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Xóa các nước đi của game
  async deleteGameMoves(gameId) {
    try {
      await pool.execute('DELETE FROM tblGamemove WHERE game_id = ?', [gameId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử nước đi dạng PGN
  async getMovesAsPGN(gameId) {
    try {
      const moves = await this.getMovesByGameId(gameId);
      let pgn = '';
      let moveNum = 1;
      
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].player_color === 'white') {
          pgn += `${moveNum}. ${moves[i].move_notation} `;
        } else {
          pgn += `${moves[i].move_notation} `;
          moveNum++;
        }
      }
      
      return pgn.trim();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new GameMoveDAO();
