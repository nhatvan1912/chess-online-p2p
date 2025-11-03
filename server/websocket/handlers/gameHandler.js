const GameService = require('../../services/GameService');
const GameDAO = require('../../dao/GameDAO');

class GameHandler {
  constructor() {
    this.activeGames = new Map(); // gameId -> { timers, drawOffer }
  }

  async makeMove(playerId, payload, wsServer) {
    try {
      const { gameId, move, fen, moveNumber, playerColor } = payload;

      const gameInfo = await GameService.getGameInfo(gameId);
      const game = gameInfo.game;

      if (
        (playerColor === 'white' && game.white_player_id !== playerId) ||
        (playerColor === 'black' && game.black_player_id !== playerId)
      ) {
        throw new Error('Không phải lượt của bạn');
      }

      await GameService.saveMove({
        game_id: gameId,
        move_number: moveNumber,
        player_color: playerColor,
        move_notation: move,
        board_state_fen: fen
      });

      const opponentId = playerColor === 'white' ? game.black_player_id : game.white_player_id;

      wsServer.sendToPlayer(opponentId, {
        type: 'opponent_move',
        gameId: gameId,
        move: move,
        fen: fen,
        moveNumber: moveNumber,
        playerColor: playerColor
      });

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

  offerDraw(playerId, gameId, wsServer) {
    GameDAO.getGameById(gameId)
      .then(game => {
        if (!game) {
          throw new Error('Game không tồn tại');
        }

        const opponentId = game.white_player_id === playerId 
          ? game.black_player_id 
          : game.white_player_id;

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

  async acceptDraw(playerId, gameId, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game) {
        throw new Error('Game không tồn tại');
      }

      await GameService.endGame(gameId, 'draw');

      const opponentId = game.white_player_id === playerId 
        ? game.black_player_id 
        : game.white_player_id;

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

  async resign(playerId, gameId, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game) {
        throw new Error('Game không tồn tại');
      }

      const result = game.white_player_id === playerId ? 'black_win' : 'white_win';
      await GameService.endGame(gameId, result);

      const opponentId = game.white_player_id === playerId 
        ? game.black_player_id 
        : game.white_player_id;

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

  sendChatMessage(playerId, payload, wsServer) {
    GameDAO.getGameById(payload.gameId)
      .then(game => {
        if (!game) {
          throw new Error('Game không tồn tại');
        }

        const opponentId = game.white_player_id === playerId 
          ? game.black_player_id 
          : game.white_player_id;

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

  async timeOut(gameId, playerColor, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game || game.status !== 'playing') {
        return;
      }

      const result = playerColor === 'white' ? 'black_win' : 'white_win';
      
      await GameService.endGame(gameId, result);
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

  async handleGameEnd(gameId, result, wsServer) {
    try {
      const game = await GameDAO.getGameById(gameId);
      if (!game || game.status !== 'playing') {
        return;
      }

      await GameService.endGame(gameId, result);

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
