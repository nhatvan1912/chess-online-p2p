const GameService = require('../../services/GameService');
const GameDAO = require('../../dao/GameDAO');

class GameHandler {
  constructor() {
    // Lưu thông tin các game đang chơi
    this.activeGames = new Map(); // gameId -> { timers, drawOffer }
  }

  // Xử lý nước đi
  async makeMove(playerId, payload, wsServer) {
    try {
      const { gameId, move, fen, moveNumber, playerColor } = payload;

      // Lấy thông tin game
      const gameInfo = await GameService.getGameInfo(gameId);
      const game = gameInfo.game;

      // Kiểm tra turn
      if (
        (playerColor === 'white' && game.white_player_id !== playerId) ||
        (playerColor === 'black' && game.black_player_id !== playerId)
      ) {
        throw new Error('Không phải lượt của bạn');
      }

      // Lưu nước đi
      await GameService.saveMove({
        game_id: gameId,
        move_number: moveNumber,
        player_color: playerColor,
        move_notation: move,
        board_state_fen: fen
      });

      // Xác định opponent
      const opponentId = playerColor === 'white' ? game.black_player_id : game.white_player_id;

      // Gửi nước đi cho opponent
      wsServer.sendToPlayer(opponentId, {
        type: 'opponent_move',
        gameId: gameId,
        move: move,
        fen: fen,
        moveNumber: moveNumber,
        playerColor: playerColor
      });

      // Confirm cho player đã di
      wsServer.sendToPlayer(playerId, {
        type: 'move_confirmed',
        gameId: gameId,
        moveNumber: moveNumber
      });
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Đề nghị hòa
  offerDraw(playerId, gameId, wsServer) {
    GameDAO.getGameById(gameId)
      .then(game => {
        if (!game) {
          throw new Error('Game không tồn tại');
        }

        const opponentId = game.white_player_id === playerId 
          ? game.black_player_id 
          : game.white_player_id;

        // Gửi đề nghị hòa cho opponent
        wsServer.sendToPlayer(opponentId, {
          type: 'draw_offered',
          gameId: gameId,
          fromPlayerId: playerId
        });

        wsServer.sendToPlayer(playerId, {
          type: 'draw_offer_sent',
          message: 'Đã gửi đề nghị hòa'
        });
      })
      .catch(error => {
        wsServer.sendToPlayer(playerId, {
          type: 'error',
          message: error.message
        });
      });
  }

  // Chấp nhận hòa
  async acceptDraw(playerId, gameId, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game) {
        throw new Error('Game không tồn tại');
      }

      // Kết thúc game với kết quả hòa
      await GameService.endGame(gameId, 'draw');

      const opponentId = game.white_player_id === playerId 
        ? game.black_player_id 
        : game.white_player_id;

      // Gửi thông báo game kết thúc
      const endGameData = {
        type: 'game_ended',
        gameId: gameId,
        result: 'draw',
        reason: 'mutual_agreement'
      };

      wsServer.sendToPlayer(playerId, endGameData);
      wsServer.sendToPlayer(opponentId, endGameData);
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Đầu hàng
  async resign(playerId, gameId, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game) {
        throw new Error('Game không tồn tại');
      }

      // Xác định kết quả
      const result = game.white_player_id === playerId ? 'black_win' : 'white_win';
      
      // Kết thúc game
      await GameService.endGame(gameId, result);

      const opponentId = game.white_player_id === playerId 
        ? game.black_player_id 
        : game.white_player_id;

      // Gửi thông báo game kết thúc
      const endGameData = {
        type: 'game_ended',
        gameId: gameId,
        result: result,
        reason: 'resignation'
      };

      wsServer.sendToPlayer(playerId, endGameData);
      wsServer.sendToPlayer(opponentId, endGameData);
    } catch (error) {
      wsServer.sendToPlayer(playerId, {
        type: 'error',
        message: error.message
      });
    }
  }

  // Gửi tin nhắn chat
  sendChatMessage(playerId, payload, wsServer) {
    GameDAO.getGameById(payload.gameId)
      .then(game => {
        if (!game) {
          throw new Error('Game không tồn tại');
        }

        const opponentId = game.white_player_id === playerId 
          ? game.black_player_id 
          : game.white_player_id;

        // Gửi message cho opponent
        wsServer.sendToPlayer(opponentId, {
          type: 'chat_message',
          gameId: payload.gameId,
          fromPlayerId: playerId,
          message: payload.message,
          timestamp: Date.now()
        });
      })
      .catch(error => {
        wsServer.sendToPlayer(playerId, {
          type: 'error',
          message: error.message
        });
      });
  }

  // Xử lý hết thời gian
  async timeOut(gameId, playerColor, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game || game.status !== 'playing') {
        return;
      }

      // Xác định kết quả (player hết time thua)
      const result = playerColor === 'white' ? 'black_win' : 'white_win';
      
      await GameService.endGame(gameId, result);

      // Gửi thông báo game kết thúc
      const endGameData = {
        type: 'game_ended',
        gameId: gameId,
        result: result,
        reason: 'timeout'
      };

      wsServer.sendToPlayer(game.white_player_id, endGameData);
      wsServer.sendToPlayer(game.black_player_id, endGameData);
    } catch (error) {
      console.error('Error handling timeout:', error);
    }
  }

  // Xử lý checkmate/stalemate từ client
  async handleGameEnd(gameId, result, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game || game.status !== 'playing') {
        return;
      }

      await GameService.endGame(gameId, result);

      // Gửi thông báo
      const endGameData = {
        type: 'game_ended',
        gameId: gameId,
        result: result,
        reason: 'checkmate'
      };

      wsServer.sendToPlayer(game.white_player_id, endGameData);
      wsServer.sendToPlayer(game.black_player_id, endGameData);
    } catch (error) {
      console.error('Error handling game end:', error);
    }
  }
}

module.exports = new GameHandler();
