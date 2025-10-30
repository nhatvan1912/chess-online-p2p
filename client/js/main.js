// Utility functions

function getCurrentPlayer() {
  const playerData = localStorage.getItem('player');
  return playerData ? JSON.parse(playerData) : null;
}

function setCurrentPlayer(player) {
  localStorage.setItem('player', JSON.stringify(player));
}

function clearCurrentPlayer() {
  localStorage.removeItem('player');
}

// Check authentication
function checkAuth() {
  const player = getCurrentPlayer();
  if (!player) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Format time in MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Show notification
function showNotification(message, type = 'info') {
  // Simple notification - could be enhanced with a library
  alert(message);
}

// API helper
async function apiCall(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}
