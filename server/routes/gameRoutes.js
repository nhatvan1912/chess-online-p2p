const express = require('express');
const router = express.Router();
const GameService = require('../services/GameService');
const authMiddleware = require('../middleware/authMiddleware');

// Lấy thông tin game
router.get('/:gameId', authMiddleware, async (req, res) => {
  try {
    const result = await GameService.getGameInfo(parseInt(req.params.gameId));
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy game đang chơi
router.get('/active/current', authMiddleware, async (req, res) => {
  try {
    const result = await GameService.getActiveGame(req.session.playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy lịch sử game
router.get('/history/player', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await GameService.getGameHistory(req.session.playerId, limit);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy lịch sử nước đi
router.get('/:gameId/moves', authMiddleware, async (req, res) => {
  try {
    const result = await GameService.getGameMoves(parseInt(req.params.gameId));
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
