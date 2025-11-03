
let game = null;
let board = null;
let currentGameId = null;
let playerColor = null;
let opponentId = null;
let moveCount = 0;

let playerTime = 600; 
let opponentTime = 600;
let timerInterval = null;
let isPlayerTurn = false;

async function initGame(gameId, playerId) {
  currentGameId = gameId;
  
  try {
    const response = await fetch(`/api/games/${gameId}`);
    const data = await response.json();
    
    if (data.success && data.game) {
      const gameData = data.game;
      
      if (gameData.white_player_id === playerId) {
        playerColor = 'white';
        opponentId = gameData.black_player_id;
      } else {
        playerColor = 'black';
        opponentId = gameData.white_player_id;
      }

      fetch(`/api/players/${opponentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            document.getElementById('opponent-name').textContent = 
              data.player.displayname || data.player.username;
          }
        });

      game = new Chess();

      const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        orientation: playerColor,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
      };

      board = Chessboard('board', config);

      if (data.moves && data.moves.length > 0) {
        data.moves.forEach(move => {
          game.move(move.move_notation);
          addMoveToList(move.move_notation, move.player_color);
        });
        board.position(game.fen());
        moveCount = data.moves.length;
      }

      updateStatus();

      isPlayerTurn = (game.turn() === playerColor.charAt(0));
      if (isPlayerTurn) {
        startTimer();
      }
    }
  } catch (error) {
    console.error('Init game error:', error);
  }
}

function onDragStart(source, piece, position, orientation) {
  if (game.game_over()) return false;
  if (!isPlayerTurn) return false;

  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' 
  });
  if (move === null) return 'snapback';
  moveCount++;
  sendMove(move, game.fen());
  addMoveToList(move.san, playerColor);
  updateStatus();
  isPlayerTurn = false;
  startTimer();
  checkGameEnd();
}

function onSnapEnd() {
  board.position(game.fen());
}

function sendMove(move, fen) {
  sendWebSocketMessage({
    type: 'make_move',
    payload: {
      gameId: parseInt(currentGameId),
      move: move.san,
      fen: fen,
      moveNumber: moveCount,
      playerColor: playerColor
    }
  });
}

function handleOpponentMove(data) {
  const move = game.move(data.move);
  if (move) {
    board.position(game.fen());
    addMoveToList(data.move, data.playerColor);
    moveCount = data.moveNumber;
    
    updateStatus();
    
    isPlayerTurn = true;
    startTimer();

    checkGameEnd();
  }
}

function updateStatus() {
  let status = '';

  if (game.in_checkmate()) {
    status = 'Chiếu hết! ';
    status += game.turn() === playerColor.charAt(0) ? 'Bạn thua!' : 'Bạn thắng!';
  } else if (game.in_draw()) {
    status = 'Hòa!';
  } else if (game.in_stalemate()) {
    status = 'Bế tắc! Hòa!';
  } else if (game.in_threefold_repetition()) {
    status = 'Lặp lại 3 lần! Hòa!';
  } else if (game.insufficient_material()) {
    status = 'Không đủ quân! Hòa!';
  } else if (game.in_check()) {
    status = 'Chiếu! ';
    status += isPlayerTurn ? 'Lượt của bạn' : 'Lượt đối thủ';
  } else {
    status = isPlayerTurn ? 'Lượt của bạn' : 'Lượt đối thủ';
  }

  document.getElementById('status-text').textContent = status;
}

function checkGameEnd() {
  if (game.game_over()) {
    stopTimer();
    
    let result = '';
    if (game.in_checkmate()) {
      result = game.turn() === playerColor.charAt(0) ? 'black_win' : 'white_win';
    } else {
      result = 'draw';
    }

    sendWebSocketMessage({
      type: 'game_end',
      payload: {
        gameId: parseInt(currentGameId),
        result: result
      }
    });
  }
}

function addMoveToList(move, color) {
  const movesList = document.getElementById('moves-list');
  const moveNum = Math.floor(moveCount / 2) + 1;
  
  if (color === 'white') {
    movesList.innerHTML += `<div>${moveNum}. ${move}</div>`;
  } else {
    const lastDiv = movesList.lastElementChild;
    if (lastDiv) {
      lastDiv.innerHTML += ` ${move}`;
    }
  }
  
  movesList.scrollTop = movesList.scrollHeight;
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    if (isPlayerTurn) {
      playerTime--;
      document.getElementById('player-timer').textContent = formatTime(playerTime);
      
      if (playerTime <= 0) {
        stopTimer();
        alert('Hết thời gian! Bạn thua.');
        sendWebSocketMessage({
          type: 'timeout',
          payload: {
            gameId: parseInt(currentGameId),
            playerColor: playerColor
          }
        });
      }
    } else {
      opponentTime--;
      document.getElementById('opponent-timer').textContent = formatTime(opponentTime);
      
      if (opponentTime <= 0) {
        stopTimer();
        alert('Đối thủ hết thời gian! Bạn thắng.');
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function offerDraw(gameId) {
  sendWebSocketMessage({
    type: 'offer_draw',
    payload: { gameId: parseInt(gameId) }
  });
  alert('Đã gửi đề nghị hòa');
}

function acceptDrawOffer(gameId) {
  sendWebSocketMessage({
    type: 'accept_draw',
    payload: { gameId: parseInt(gameId) }
  });
}

function resignGame(gameId) {
  sendWebSocketMessage({
    type: 'resign',
    payload: { gameId: parseInt(gameId) }
  });
}

function handleGameEnd(data) {
  stopTimer();
  
  let title = '';
  let message = '';
  
  if (data.result === 'white_win') {
    if (playerColor === 'white') {
      title = '🎉 Bạn thắng!';
      message = 'Chúc mừng bạn đã chiến thắng!';
    } else {
      title = '😔 Bạn thua';
      message = 'Chúc bạn may mắn lần sau!';
    }
  } else if (data.result === 'black_win') {
    if (playerColor === 'black') {
      title = '🎉 Bạn thắng!';
      message = 'Chúc mừng bạn đã chiến thắng!';
    } else {
      title = '😔 Bạn thua';
      message = 'Chúc bạn may mắn lần sau!';
    }
  } else {
    title = '🤝 Hòa';
    message = 'Trận đấu kết thúc với kết quả hòa';
  }

  if (data.reason === 'resignation') {
    message += ' (Đối thủ đầu hàng)';
  } else if (data.reason === 'timeout') {
    message += ' (Hết thời gian)';
  } else if (data.reason === 'mutual_agreement') {
    message += ' (Thỏa thuận hòa)';
  }

  document.getElementById('result-title').textContent = title;
  document.getElementById('result-message').textContent = message;
  document.getElementById('game-end-modal').style.display = 'flex';
}

function sendChatMessage(gameId) {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;

  sendWebSocketMessage({
    type: 'chat_message',
    payload: {
      gameId: parseInt(gameId),
      message: message
    }
  });

  addChatMessage(message, true);
  input.value = '';
}

function addChatMessage(message, isOwn) {
  const chatMessages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-message ${isOwn ? 'own' : ''}`;
  div.textContent = sanitizeText(message);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sanitizeText(text) {
  return String(text).replace(/[<>]/g, '');
}

window.initGame = initGame;
window.handleOpponentMove = handleOpponentMove;
window.offerDraw = offerDraw;
window.acceptDrawOffer = acceptDrawOffer;
window.resignGame = resignGame;
window.handleGameEnd = handleGameEnd;
window.sendChatMessage = sendChatMessage;
window.addChatMessage = addChatMessage;
