// Matchmaking functionality

let matchmakingTimer = 0;
let timerInterval = null;
let acceptTimer = 30;
let acceptInterval = null;
let currentMatchId = null;

function startMatchmaking() {
  // Hide initial status, show waiting
  document.getElementById('matchmaking-status').style.display = 'none';
  document.getElementById('waiting-status').style.display = 'block';

  // Start timer
  matchmakingTimer = 0;
  timerInterval = setInterval(() => {
    matchmakingTimer++;
    document.getElementById('timer').textContent = matchmakingTimer;
  }, 1000);

  // Send join matchmaking request
  sendWebSocketMessage({
    type: 'join_matchmaking'
  });
}

function cancelMatchmaking() {
  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Send leave matchmaking request
  sendWebSocketMessage({
    type: 'leave_matchmaking'
  });

  // Reset UI
  document.getElementById('waiting-status').style.display = 'none';
  document.getElementById('matchmaking-status').style.display = 'block';
}

function acceptMatch() {
  if (!currentMatchId) return;

  sendWebSocketMessage({
    type: 'accept_match',
    payload: { matchId: currentMatchId }
  });

  // Show waiting for opponent
  document.getElementById('match-found').style.display = 'none';
  document.getElementById('waiting-opponent').style.display = 'block';

  // Stop accept timer
  if (acceptInterval) {
    clearInterval(acceptInterval);
    acceptInterval = null;
  }
}

function declineMatch() {
  if (!currentMatchId) return;

  sendWebSocketMessage({
    type: 'decline_match',
    payload: { matchId: currentMatchId }
  });

  // Reset UI
  document.getElementById('match-found').style.display = 'none';
  document.getElementById('matchmaking-status').style.display = 'block';
  currentMatchId = null;

  // Stop accept timer
  if (acceptInterval) {
    clearInterval(acceptInterval);
    acceptInterval = null;
  }
}

// Override WebSocket message handler for matchmaking
if (window.ws) {
  const originalHandler = window.handleWebSocketMessage;
  window.handleWebSocketMessage = function(data) {
    switch (data.type) {
      case 'matchmaking_joined':
        console.log('Joined matchmaking queue');
        break;

      case 'match_found':
        // Stop waiting timer
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        // Show match found
        currentMatchId = data.matchId;
        document.getElementById('waiting-status').style.display = 'none';
        document.getElementById('match-found').style.display = 'block';

        // Start accept timer
        acceptTimer = 30;
        document.getElementById('accept-timer').textContent = acceptTimer;
        acceptInterval = setInterval(() => {
          acceptTimer--;
          document.getElementById('accept-timer').textContent = acceptTimer;
          if (acceptTimer <= 0) {
            clearInterval(acceptInterval);
            declineMatch();
          }
        }, 1000);
        break;

      case 'match_accepted':
        console.log('Match accepted, waiting for opponent...');
        break;

      case 'game_started':
        // Stop all timers
        if (timerInterval) clearInterval(timerInterval);
        if (acceptInterval) clearInterval(acceptInterval);

        // Redirect to game board
        window.location.href = `/game-board?gameId=${data.gameId}`;
        break;

      case 'match_declined':
        // Reset UI
        document.getElementById('match-found').style.display = 'none';
        document.getElementById('waiting-opponent').style.display = 'none';
        document.getElementById('matchmaking-status').style.display = 'block';
        currentMatchId = null;
        break;

      default:
        if (originalHandler) originalHandler(data);
    }
  };
}
