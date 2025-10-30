const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');

// Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, displayname } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    const result = await AuthService.register(username, password, email, displayname);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu username hoặc password'
      });
    }

    const result = await AuthService.login(username, password);
    
    // Lưu vào session
    req.session.playerId = result.player.player_id;
    req.session.username = result.player.username;

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Đăng xuất
router.post('/logout', async (req, res) => {
  try {
    if (req.session.playerId) {
      await AuthService.logout(req.session.playerId);
      req.session.destroy();
    }
    
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Kiểm tra session
router.get('/check-session', async (req, res) => {
  try {
    if (!req.session.playerId) {
      return res.json({ valid: false });
    }

    const result = await AuthService.validateSession(req.session.playerId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
