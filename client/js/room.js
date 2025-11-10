let selectedRoomIdForPassword = null;

async function createRoom() {
  const roomName = document.getElementById('room-name').value;
  const roomType = document.getElementById('room-type').value;
  const roomMode = document.getElementById('room-mode').value;
  const password = roomType === 'private' ? document.getElementById('room-password').value : null;

  let timeSettings = {};
  if (roomMode === 'normal') {
    timeSettings.per_move_max_sec = parseInt(document.getElementById('per-move-time').value);
  } else {
    timeSettings.time_initial_sec = parseInt(document.getElementById('initial-time').value);
    timeSettings.increment_sec = parseInt(document.getElementById('increment-time').value);
  }

  try {
    const response = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: roomName,
        room_type: roomType,
        room_mode: roomMode,
        password: password,
        ...timeSettings
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Redirect to room detail
      window.location.href = `/room-detail?roomId=${data.room.id}`;
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Create room error:', error);
    alert('Lỗi tạo phòng');
  }
}

async function loadRooms() {
  try {
    const response = await fetch('/api/rooms/waiting');
    const data = await response.json();
    
    if (data.success) {
      displayRooms(data.rooms);
    }
  } catch (error) {
    console.error('Load rooms error:', error);
  }
}

function displayRooms(rooms) {
  const roomsList = document.getElementById('rooms-list');
  
  if (rooms.length === 0) {
    roomsList.innerHTML = '<p class="loading">Chưa có phòng nào</p>';
    return;
  }

  roomsList.innerHTML = rooms.map(room => `
    <div class="room-item">
      <div class="room-info">
        <h4>${room.room_name || 'Room'} ${room.room_type === 'private' ? '🔒' : ''}</h4>
        <p>Mã: ${room.room_code}</p>
        <p>Chế độ: ${room.room_mode}</p>
        <p>Host: ${room.host_displayname || room.host_username}</p>
      </div>
      <button class="btn btn-primary btn-sm" onclick="joinRoom(${room.id}, '${room.room_type}')">
        Tham gia
      </button>
    </div>
  `).join('');
}

async function joinRoom(roomId, roomType) {
  if (roomType === 'private') {
    // Show password modal
    selectedRoomIdForPassword = roomId;
    document.getElementById('password-modal').style.display = 'flex';
    return;
  }

  await joinRoomWithPassword(roomId, null);
}

async function joinRoomWithPassword(roomId, password) {
  try {
    const response = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    console.log(password);
    const data = await response.json();
    
    if (data.success) {
      window.location.href = `/room-detail?roomId=${roomId}`;
      sendWebSocketMessage({
        type: 'join_success',
        payload: { roomId: parseInt(roomId)}
      });
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Join room error:', error);
    alert('Lỗi tham gia phòng');
  }
}

// Password modal handlers
if (document.getElementById('submit-password-btn')) {
  document.getElementById('submit-password-btn').addEventListener('click', () => {
    const password = document.getElementById('join-password').value;
    if (selectedRoomIdForPassword) {
      joinRoomWithPassword(selectedRoomIdForPassword, password);
      document.getElementById('password-modal').style.display = 'none';
      document.getElementById('join-password').value = '';
      selectedRoomIdForPassword = null;
    }
  });
}

if (document.getElementById('cancel-password-btn')) {
  document.getElementById('cancel-password-btn').addEventListener('click', () => {
    document.getElementById('password-modal').style.display = 'none';
    document.getElementById('join-password').value = '';
    selectedRoomIdForPassword = null;
  });
}

// Room detail functions
async function loadRoomDetails(roomId) {
  try {
    const response = await fetch(`/api/rooms/${roomId}`);
    const data = await response.json();
    
    if (data.success && data.room) {
      updateRoomDetailsUI(data.room);
    }
  } catch (error) {
    console.error('Load room details error:', error);
  }
}

function updateRoomDetailsUI(room) {
  document.getElementById('room-title').textContent = room.room_name || 'Room';
  document.getElementById('room-code').textContent = room.room_code;
  document.getElementById('room-mode').textContent = room.room_mode;
  
  // Time info
  let timeText = '';
  if (room.room_mode === 'normal') {
    timeText = `Thời gian: ${room.per_move_max_sec}s/nước`;
  } else {
    timeText = `Thời gian: ${room.time_initial_sec}s + ${room.increment_sec}s/nước`;
  }
  document.getElementById('time-info').textContent = timeText;

  // Host info
  if (room.host_player_id) {
    // Fetch host info
    fetch(`/api/players/${room.host_player_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('host-name').textContent = data.player.displayname || data.player.username;
        }
      });
    
    const hostStatus = document.getElementById('host-status');
    hostStatus.querySelector('span:last-child').textContent = room.host_ready ? '✓ Sẵn sàng' : 'Chưa sẵn sàng';
    hostStatus.classList.toggle('ready', room.host_ready);
    
  }

  // Guest info
  if (room.guest_player_id) {
    fetch(`/api/players/${room.guest_player_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('guest-name').textContent = data.player.displayname || data.player.username;
        }
      });
    
    const guestStatus = document.getElementById('guest-status');
    guestStatus.querySelector('span:last-child').textContent = room.guest_ready ? '✓ Sẵn sàng' : 'Chưa sẵn sàng';
    guestStatus.classList.toggle('ready', room.guest_ready);
  } else {
    document.getElementById('guest-name').textContent = 'Đang chờ...';
    const guestStatus = document.getElementById('guest-status');
    guestStatus.classList.toggle('ready', 0);
    guestStatus.querySelector('span:last-child').textContent = 'Chưa sẵn sàng';
  }

  // Show/hide start button for host
  const player = getCurrentPlayer();
  if (room.host_player_id === player.player_id) {
    const startBtn = document.getElementById('start-game-btn');
    startBtn.style.display = 'block';
    startBtn.disabled = !(room.host_ready && room.guest_ready && room.guest_player_id);

    const readyBtn = document.getElementById('ready-btn');
    readyBtn.textContent = room.host_ready ? 'Hủy sẵn sàng' : 'Sẵn sàng';
    readyBtn.className = room.host_ready ? 'btn btn-secondary btn-large' : 'btn btn-success btn-large';
  }
  else{
    const readyBtn = document.getElementById('ready-btn');
    readyBtn.textContent = room.guest_ready ? 'Hủy sẵn sàng' : 'Sẵn sàng';
    readyBtn.className = room.guest_ready ? 'btn btn-secondary btn-large' : 'btn btn-success btn-large';
  }
}

function toggleReady(roomId, isReady) {
  sendWebSocketMessage({
    type: 'room_ready',
    payload: { roomId: parseInt(roomId), isReady }
  });

  // Update button
  const readyBtn = document.getElementById('ready-btn');
  readyBtn.textContent = isReady ? 'Hủy sẵn sàng' : 'Sẵn sàng';
  readyBtn.className = isReady ? 'btn btn-secondary btn-large' : 'btn btn-success btn-large';
}

function startGameFromRoom(roomId) {
  sendWebSocketMessage({
    type: 'start_game',
    payload: { roomId: parseInt(roomId) }
  });
}

async function loadOnlinePlayers() {
  try {
    const response = await fetch('/api/players/online/list');
    const data = await response.json();
    
    if (data.success) {
      displayOnlinePlayers(data.players);
    }
  } catch (error) {
    console.error('Load online players error:', error);
  }
}

function displayOnlinePlayers(players) {
  const listEl = document.getElementById('online-players-list');
  const currentPlayer = getCurrentPlayer();
  
  // Filter out current player
  const otherPlayers = players.filter(p => p.player_id !== currentPlayer.player_id);
  
  if (otherPlayers.length === 0) {
    listEl.innerHTML = '<p class="loading">Không có người chơi online khác</p>';
    return;
  }

  listEl.innerHTML = otherPlayers.map(player => `
    <div class="online-player-item">
      <span>${player.displayname || player.username}</span>
      <button class="btn btn-primary btn-sm" onclick="invitePlayer(${player.player_id})">
        Mời
      </button>
    </div>
  `).join('');
}

function invitePlayer(targetPlayerId) {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  
  sendWebSocketMessage({
    type: 'invite_player',
    payload: {
      targetPlayerId: parseInt(targetPlayerId),
      roomId: parseInt(roomId)
    }
  });

  alert('Đã gửi lời mời');
}

function leaveRoom(roomId){
  sendWebSocketMessage({
    type: 'leave_room',
    payload: { roomId: parseInt(roomId) }
  });
}


// Export functions
window.createRoom = createRoom;
window.loadRooms = loadRooms;
window.joinRoom = joinRoom;
window.joinRoomWithPassword = joinRoomWithPassword;
window.loadRoomDetails = loadRoomDetails;
window.toggleReady = toggleReady;
window.startGameFromRoom = startGameFromRoom;
window.loadOnlinePlayers = loadOnlinePlayers;
window.invitePlayer = invitePlayer;
window.leaveRoom = leaveRoom;