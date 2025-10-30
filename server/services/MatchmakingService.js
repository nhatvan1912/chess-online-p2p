const PlayerStatsDAO = require('../dao/PlayerStatsDAO');

class MatchmakingService {
  constructor() {
    // Queue chứa player đang chờ matchmaking
    this.queue = new Map(); // playerId -> { playerId, point, timestamp }
    // Matches đang chờ accept
    this.pendingMatches = new Map(); // matchId -> { player1, player2, timestamp }
  }

  // Thêm player vào queue
  async addToQueue(playerId) {
    try {
      // Lấy điểm của player
      const stats = await PlayerStatsDAO.getPlayerStats(playerId);
      const point = stats ? stats.point : 0;

      this.queue.set(playerId, {
        playerId,
        point,
        timestamp: Date.now()
      });

      // Thử tìm đối thủ ngay
      return this.findMatch(playerId);
    } catch (error) {
      throw error;
    }
  }

  // Xóa player khỏi queue
  removeFromQueue(playerId) {
    this.queue.delete(playerId);
  }

  // Tìm đối thủ cho player (point difference <= 50)
  async findMatch(playerId) {
    try {
      const player = this.queue.get(playerId);
      if (!player) return null;

      // Tìm đối thủ phù hợp trong queue
      for (const [opponentId, opponent] of this.queue) {
        if (opponentId === playerId) continue;

        const pointDiff = Math.abs(player.point - opponent.point);
        if (pointDiff <= 50) {
          // Tìm thấy match
          const matchId = `${Date.now()}_${playerId}_${opponentId}`;
          
          this.pendingMatches.set(matchId, {
            matchId,
            player1: player,
            player2: opponent,
            timestamp: Date.now(),
            player1Accepted: false,
            player2Accepted: false
          });

          // Xóa khỏi queue
          this.queue.delete(playerId);
          this.queue.delete(opponentId);

          return {
            matchId,
            player1Id: player.playerId,
            player2Id: opponent.playerId
          };
        }
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Player accept match
  acceptMatch(matchId, playerId) {
    const match = this.pendingMatches.get(matchId);
    if (!match) return null;

    if (match.player1.playerId === playerId) {
      match.player1Accepted = true;
    } else if (match.player2.playerId === playerId) {
      match.player2Accepted = true;
    }

    // Nếu cả 2 đã accept
    if (match.player1Accepted && match.player2Accepted) {
      this.pendingMatches.delete(matchId);
      return {
        ready: true,
        player1Id: match.player1.playerId,
        player2Id: match.player2.playerId
      };
    }

    return { ready: false };
  }

  // Player decline match
  declineMatch(matchId, playerId) {
    const match = this.pendingMatches.get(matchId);
    if (!match) return null;

    // Trả cả 2 player về queue
    this.queue.set(match.player1.playerId, match.player1);
    this.queue.set(match.player2.playerId, match.player2);

    this.pendingMatches.delete(matchId);
    return true;
  }

  // Lấy match đang pending
  getPendingMatch(matchId) {
    return this.pendingMatches.get(matchId);
  }

  // Kiểm tra player có trong queue không
  isInQueue(playerId) {
    return this.queue.has(playerId);
  }

  // Lấy số lượng player trong queue
  getQueueSize() {
    return this.queue.size;
  }

  // Clean up expired matches (timeout 30 giây)
  cleanupExpiredMatches() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [matchId, match] of this.pendingMatches) {
      if (now - match.timestamp > timeout) {
        // Trả player về queue
        this.queue.set(match.player1.playerId, match.player1);
        this.queue.set(match.player2.playerId, match.player2);
        this.pendingMatches.delete(matchId);
      }
    }
  }
}

module.exports = new MatchmakingService();
