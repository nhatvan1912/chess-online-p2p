const express = require('express');
const http = require('http');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const roomRoutes = require('./routes/roomRoutes');
const gameRoutes = require('./routes/gameRoutes');

const WebSocketServer = require('./websocket/WebSocketServer');
const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'chess-game-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/games', gameRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/login.html'));
});

app.get('/play-mode', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/play-mode.html'));
});

app.get('/ranking', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/ranking.html'));
});

app.get('/custom-match', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/custom-match.html'));
});

app.get('/room-detail', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/room-detail.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/game.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi server'
  });
});

const wsServer = new WebSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP Server: http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server, wsServer };
