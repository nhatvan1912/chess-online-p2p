const GameDAO = require('../dao/GameDAO');
const GameMoveDAO = require('../dao/GameMoveDAO');
const PlayerStatsDAO = require('../dao/PlayerStatsDAO');
const RoomDAO = require('../dao/RoomDAO');

class GameService {
  // Tạo game mới
  async createGame(gameData) {
    try {
      // Random phân màu quân cờ
      const isWhiteFirst = Math.random() >= 0.5;
      
      const game = {
        game_mode: gameData.game_mode || 'normal',
        room_id: gameData.room_id,
        white_player_id: isWhiteFirst ? gameData.player1_id : gameData.player2_id,
        black_player_id: isWhiteFirst ? gameData.player2_id : gameData.player1_id,
        is_ranked: gameData.is_ranked || false
      };

      const gameId = await GameDAO.createGame(game);

      // Cập nhật trạng thái phòng nếu có
      if (gameData.room_id) {
        await RoomDAO.updateRoomStatus(gameData.room_id, 'playing');
      }

      return {
        success: true,
        gameId,
        whitePlayerId: game.white_player_id,
        blackPlayerId: game.black_player_id,
        message: 'Tạo game thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  // Lưu nước đi
  async saveMove(moveData) {
    try {
      await GameMoveDAO.createMove(moveData);
      return {
        success: true,
        message: 'Lưu nước đi thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  // Kết thúc game
  async endGame(gameId, result) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game) {
        throw new Error('Game không tồn tại');
      }

      // Tính điểm thay đổi
      let whitePointChange = 0;
      let blackPointChange = 0;

      if (game.is_ranked) {
        if (result === 'white_win') {
          whitePointChange = 3;
          blackPointChange = 0;
        } else if (result === 'black_win') {
          whitePointChange = 0;
          blackPointChange = 3;
        } else if (result === 'draw') {
          whitePointChange = 1;
          blackPointChange = 1;
        }
      }

      // Cập nhật kết quả game
      await GameDAO.endGame(gameId, result, whitePointChange, blackPointChange);

      // Cập nhật stats của player nếu là ranked
      if (game.is_ranked) {
        if (result === 'white_win') {
          await PlayerStatsDAO.updateStats(game.white_player_id, 'win', whitePointChange);
          await PlayerStatsDAO.updateStats(game.black_player_id, 'loss', blackPointChange);
        } else if (result === 'black_win') {
          await PlayerStatsDAO.updateStats(game.white_player_id, 'loss', whitePointChange);
          await PlayerStatsDAO.updateStats(game.black_player_id, 'win', blackPointChange);
        } else if (result === 'draw') {
          await PlayerStatsDAO.updateStats(game.white_player_id, 'draw', whitePointChange);
          await PlayerStatsDAO.updateStats(game.black_player_id, 'draw', blackPointChange);
        }
      }

      // Cập nhật trạng thái phòng nếu có
      if (game.room_id) {
        await RoomDAO.updateRoomStatus(game.room_id, 'finished');
      }

      return {
        success: true,
        whitePointChange,
        blackPointChange,
        message: 'Kết thúc game thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin game
  async getGameInfo(gameId) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game) {
        throw new Error('Game không tồn tại');
      }

      const moves = await GameMoveDAO.getMovesByGameId(gameId);
      
      return {
        success: true,
        game,
        moves
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy game đang chơi của player
  async getActiveGame(playerId) {
    try {
      const game = await GameDAO.getActiveGame(playerId);
      return {
        success: true,
        game
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử game
  async getGameHistory(playerId, limit = 10) {
    try {
      const games = await GameDAO.getPlayerGameHistory(playerId, limit);
      return {
        success: true,
        games
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử nước đi
  async getGameMoves(gameId) {
    try {
      const moves = await GameMoveDAO.getMovesByGameId(gameId);
      return {
        success: true,
        moves
      };
    } catch (error) {
      throw error;
    }
  }

  // Validate nước đi (có thể thêm logic validate với chess.js ở đây)
  validateMove(from, to, fen) {
    // Placeholder - client sẽ validate với chess.js
    return true;
  }
}

module.exports = new GameService();
