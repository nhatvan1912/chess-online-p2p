const bcrypt = require('bcrypt');
const PlayerDAO = require('../dao/PlayerDAO');

class AuthService {
  async register(username, password, email, displayname = null) {
    try {
      const existingUser = await PlayerDAO.getPlayerByUsername(username);
      if (existingUser) {
        throw new Error('Username đã tồn tại');
      }

      const existingEmail = await PlayerDAO.getPlayerByEmail(email);
      if (existingEmail) {
        throw new Error('Email đã được sử dụng');
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const playerId = await PlayerDAO.createPlayer(username, passwordHash, email, displayname);
      
      return {
        success: true,
        playerId,
        message: 'Đăng ký thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async login(username, password) {
    try {
      const player = await PlayerDAO.getPlayerByUsername(username);
      if (!player) {
        throw new Error('Username hoặc password không đúng');
      }

      const isPasswordValid = await bcrypt.compare(password, player.password_hash);
      if (!isPasswordValid) {
        throw new Error('Username hoặc password không đúng');
      }
      await PlayerDAO.updatePlayerStatus(player.player_id, 'online');

      return {
        success: true,
        player: {
          player_id: player.player_id,
          username: player.username,
          email: player.email,
          displayname: player.displayname,
          status: 'online'
        },
        message: 'Đăng nhập thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(playerId) {
    try {
      await PlayerDAO.updatePlayerStatus(playerId, 'offline');
      return {
        success: true,
        message: 'Đăng xuất thành công'
      };
    } catch (error) {
      throw error;
    }
  }

  async validateSession(playerId) {
    try {
      const player = await PlayerDAO.getPlayerById(playerId);
      if (!player) {
        return { valid: false };
      }
      
      return {
        valid: true,
        player: {
          player_id: player.player_id,
          username: player.username,
          email: player.email,
          displayname: player.displayname,
          status: player.status
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
