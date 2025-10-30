const express = require('express');
const router = express.Router();
const PlayerDAO = require('../dao/PlayerDAO');
const PlayerStatsDAO = require('../dao/PlayerStatsDAO');
const authMiddleware = require('../middleware/authMiddleware');

// Lấy thông tin player
router.get('/:playerId', authMiddleware, async (req, res) => {
  try {
    const player = await PlayerDAO.getPlayerById(req.params.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy player'
      });
    }
    
    res.json({
      success: true,
      player
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy thống kê player
router.get('/:playerId/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await PlayerStatsDAO.getPlayerStatsWithInfo(req.params.playerId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thống kê'
      });
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy danh sách player online
router.get('/online/list', authMiddleware, async (req, res) => {
  try {
    const players = await PlayerDAO.getOnlinePlayers();
    res.json({
      success: true,
      players
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy bảng xếp hạng
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await PlayerStatsDAO.getLeaderboard(limit);
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
