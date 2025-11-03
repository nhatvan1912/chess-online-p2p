
let matchmakingTimer = 0;
let timerInterval = null;
let acceptTimer = 30;
let acceptInterval = null;
let currentMatchId = null;

function startMatchmaking() {
  document.getElementById('matchmaking-status').style.display = 'none';
  document.getElementById('waiting-status').style.display = 'block';

  matchmakingTimer = 0;
  timerInterval = setInterval(() => {
    matchmakingTimer++;
    document.getElementById('timer').textContent = matchmakingTimer;
  }, 1000);

  sendWebSocketMessage({
    type: 'join_matchmaking'
  });
}

function cancelMatchmaking() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  sendWebSocketMessage({
    type: 'leave_matchmaking'
  });

  document.getElementById('waiting-status').style.display = 'none';
  document.getElementById('matchmaking-status').style.display = 'block';
}

function acceptMatch() {
  if (!currentMatchId) return;

  sendWebSocketMessage({
    type: 'accept_match',
    payload: { matchId: currentMatchId }
  });

  document.getElementById('match-found').style.display = 'none';
  document.getElementById('waiting-opponent').style.display = 'block';

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

  document.getElementById('match-found').style.display = 'none';
  document.getElementById('matchmaking-status').style.display = 'block';
  currentMatchId = null;

  if (acceptInterval) {
    clearInterval(acceptInterval);
    acceptInterval = null;
  }
}

// Override WebSocket message handler for matchmaking
const originalHandler = window.handleWebSocketMessage;
window.handleWebSocketMessage = function (data) {
  switch (data.type) {
    case 'matchmaking_joined':
      console.log('Joined matchmaking queue');
      break;

    case 'match_found':
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      currentMatchId = data.matchId;
      document.getElementById('waiting-status').style.display = 'none';
      document.getElementById('match-found').style.display = 'block';

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
      if (timerInterval) clearInterval(timerInterval);
      if (acceptInterval) clearInterval(acceptInterval);

      window.location.href = `/game?gameId=${data.gameId}`;
      break;

    case 'match_declined':
      document.getElementById('match-found').style.display = 'none';
      document.getElementById('waiting-opponent').style.display = 'none';
      document.getElementById('matchmaking-status').style.display = 'block';
      currentMatchId = null;
      break;

    default:
      if (originalHandler) originalHandler(data);
  };
}
