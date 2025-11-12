const express = require('express');
const router = express.Router();
const RoomService = require('../services/RoomService');
const authMiddleware = require('../middleware/authMiddleware');

// Tạo phòng
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const roomData = {
      ...req.body,
      host_player_id: req.session.playerId
    };

    const result = await RoomService.createRoom(roomData);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy danh sách phòng đang chờ
router.get('/waiting', authMiddleware, async (req, res) => {
  try {
    const result = await RoomService.getWaitingRooms();
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Tham gia phòng
router.get('/:roomId/join', authMiddleware, async (req, res) => {
  try {
    const result = await RoomService.joinRoom(
      parseInt(req.params.roomId),
      req.session.playerId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Rời phòng
router.post('/:roomId/leave', authMiddleware, async (req, res) => {
  try {
    const result = await RoomService.leaveRoom(
      parseInt(req.params.roomId),
      req.session.playerId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy thông tin phòng
router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const result = await RoomService.getRoomInfo(parseInt(req.params.roomId));
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Lấy phòng hiện tại của player
router.get('/player/current', authMiddleware, async (req, res) => {
  try {
    const result = await RoomService.getPlayerRoom(req.session.playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
