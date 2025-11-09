// WebSocket connection management

let ws = null;
let reconnectInterval = null;
let isConnected = false;

function initWebSocket(playerId) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}?playerId=${playerId}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    isConnected = true;
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 WebSocket message:', data);
      handleWebSocketMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('❌ WebSocket disconnected');
    isConnected = false;
    
    // Attempt to reconnect every 5 seconds
    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        console.log('🔄 Attempting to reconnect...');
        initWebSocket(playerId);
      }, 5000);
    }
  };

  window.ws = ws;
}

function sendWebSocketMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  } else {
    console.error('WebSocket is not connected');
    return false;
  }
}

function handleWebSocketMessage(data) {
  // Default handler - can be overridden by specific pages
  switch (data.type) {
    case 'connected':
      console.log('WebSocket connection confirmed');
      break;
    case 'error':
      console.error('Server error:', data.message);
      alert(data.message);
      break;
    default:
      // Let page-specific handlers deal with it
      console.log('Unhandled message type:', data.type);
  }
}

function closeWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

// Export for use in other files
window.initWebSocket = initWebSocket;
window.sendWebSocketMessage = sendWebSocketMessage;
window.closeWebSocket = closeWebSocket;
window.ws = ws;
