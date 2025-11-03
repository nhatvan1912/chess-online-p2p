const PlayerStatsDAO = require('../dao/PlayerStatsDAO');

class MatchmakingService {
  constructor() {
    this.queue = new Map(); // playerId -> { playerId, point, timestamp }
    this.pendingMatches = new Map(); // matchId -> { player1, player2, timestamp }
  }

  async addToQueue(playerId) {
    try {
      const stats = await PlayerStatsDAO.getPlayerStats(playerId);
      const point = stats ? stats.point : 0;

      this.queue.set(playerId, {
        playerId,
        point,
        timestamp: Date.now()
      });

      return this.findMatch(playerId);
    } catch (error) {
      throw error;
    }
  }

  removeFromQueue(playerId) {
    this.queue.delete(playerId);
  }

  async findMatch(playerId) {
    try {
      const player = this.queue.get(playerId);
      if (!player) return null;

      for (const [opponentId, opponent] of this.queue) {
        if (opponentId === playerId) continue;

        const pointDiff = Math.abs(player.point - opponent.point);
        if (pointDiff <= 50) {
          const matchId = `${Date.now()}_${playerId}_${opponentId}`;
          
          this.pendingMatches.set(matchId, {
            matchId,
            player1: player,
            player2: opponent,
            timestamp: Date.now(),
            player1Accepted: false,
            player2Accepted: false
          });

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

  acceptMatch(matchId, playerId) {
    const match = this.pendingMatches.get(matchId);
    if (!match) return null;

    if (match.player1.playerId === playerId) {
      match.player1Accepted = true;
    } else if (match.player2.playerId === playerId) {
      match.player2Accepted = true;
    }

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

  declineMatch(matchId, playerId) {
    const match = this.pendingMatches.get(matchId);
    if (!match) return null;

    this.queue.set(match.player1.playerId, match.player1);
    this.queue.set(match.player2.playerId, match.player2);

    this.pendingMatches.delete(matchId);
    return true;
  }

  getPendingMatch(matchId) {
    return this.pendingMatches.get(matchId);
  }

  isInQueue(playerId) {
    return this.queue.has(playerId);
  }

  getQueueSize() {
    return this.queue.size;
  }

  cleanupExpiredMatches() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [matchId, match] of this.pendingMatches) {
      if (now - match.timestamp > timeout) {
        this.queue.set(match.player1.playerId, match.player1);
        this.queue.set(match.player2.playerId, match.player2);
        this.pendingMatches.delete(matchId);
      }
    }
  }
}

module.exports = new MatchmakingService();
