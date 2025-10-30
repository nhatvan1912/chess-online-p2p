# 📡 API Documentation

## REST API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Đăng ký tài khoản mới.

**Request Body:**
```json
{
  "username": "string (required, min 3 chars)",
  "password": "string (required, min 6 chars)",
  "email": "string (required, valid email)",
  "displayname": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "playerId": 1,
  "message": "Đăng ký thành công"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Username đã tồn tại"
}
```

---

#### POST /api/auth/login
Đăng nhập vào hệ thống.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "player": {
    "player_id": 1,
    "username": "test1",
    "email": "test1@example.com",
    "displayname": "Test User",
    "status": "online"
  },
  "message": "Đăng nhập thành công"
}
```

---

#### POST /api/auth/logout
Đăng xuất khỏi hệ thống.

**Response:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

#### GET /api/auth/check-session
Kiểm tra session hiện tại.

**Response:**
```json
{
  "valid": true,
  "player": {
    "player_id": 1,
    "username": "test1",
    "email": "test1@example.com",
    "displayname": "Test User",
    "status": "online"
  }
}
```

---

### Player Endpoints

#### GET /api/players/:playerId
Lấy thông tin player theo ID.

**Response:**
```json
{
  "success": true,
  "player": {
    "player_id": 1,
    "username": "test1",
    "email": "test1@example.com",
    "displayname": "Test User",
    "status": "online",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### GET /api/players/:playerId/stats
Lấy thống kê của player.

**Response:**
```json
{
  "success": true,
  "stats": {
    "player_id": 1,
    "username": "test1",
    "displayname": "Test User",
    "games_played": 10,
    "point": 15,
    "wins": 5,
    "losses": 3,
    "draws": 2
  }
}
```

---

#### GET /api/players/online/list
Lấy danh sách player đang online.

**Response:**
```json
{
  "success": true,
  "players": [
    {
      "player_id": 1,
      "username": "test1",
      "displayname": "Test User",
      "status": "online"
    },
    {
      "player_id": 2,
      "username": "test2",
      "displayname": "Test User 2",
      "status": "online"
    }
  ]
}
```

---

#### GET /api/players/leaderboard/top
Lấy bảng xếp hạng.

**Query Parameters:**
- `limit` (optional): Số lượng player hiển thị (default: 10)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "player_id": 1,
      "username": "test1",
      "displayname": "Test User",
      "point": 50,
      "games_played": 20,
      "wins": 15,
      "losses": 3,
      "draws": 2
    }
  ]
}
```

---

### Room Endpoints

#### POST /api/rooms/create
Tạo phòng mới.

**Request Body:**
```json
{
  "room_name": "My Room",
  "room_type": "public|private",
  "room_mode": "normal|blitz",
  "password": "string (required if private)",
  "time_initial_sec": 300,
  "per_move_max_sec": 60,
  "increment_sec": 3
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": 1,
    "room_code": "ABC123",
    "room_name": "My Room",
    "room_type": "public",
    "room_mode": "normal",
    "status": "waiting",
    "host_player_id": 1
  },
  "message": "Tạo phòng thành công"
}
```

---

#### GET /api/rooms/waiting
Lấy danh sách phòng đang chờ.

**Response:**
```json
{
  "success": true,
  "rooms": [
    {
      "id": 1,
      "room_code": "ABC123",
      "room_name": "My Room",
      "room_type": "public",
      "room_mode": "normal",
      "status": "waiting",
      "host_player_id": 1,
      "host_username": "test1",
      "host_displayname": "Test User",
      "guest_player_id": null
    }
  ]
}
```

---

#### POST /api/rooms/:roomId/join
Tham gia phòng.

**Request Body:**
```json
{
  "password": "string (required if private room)"
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": 1,
    "room_code": "ABC123",
    "guest_player_id": 2
  },
  "message": "Tham gia phòng thành công"
}
```

---

#### POST /api/rooms/:roomId/leave
Rời phòng.

**Response:**
```json
{
  "success": true,
  "message": "Rời phòng thành công"
}
```

---

#### GET /api/rooms/:roomId
Lấy thông tin chi tiết phòng.

**Response:**
```json
{
  "success": true,
  "room": {
    "id": 1,
    "room_code": "ABC123",
    "room_name": "My Room",
    "room_type": "public",
    "room_mode": "blitz",
    "status": "waiting",
    "time_initial_sec": 300,
    "increment_sec": 3,
    "host_player_id": 1,
    "guest_player_id": 2,
    "host_ready": true,
    "guest_ready": false
  }
}
```

---

### Game Endpoints

#### GET /api/games/:gameId
Lấy thông tin game.

**Response:**
```json
{
  "success": true,
  "game": {
    "game_id": 1,
    "game_mode": "normal",
    "status": "playing",
    "result": null,
    "white_player_id": 1,
    "black_player_id": 2,
    "is_ranked": true,
    "start_time": "2024-01-01T10:00:00.000Z"
  },
  "moves": [
    {
      "move_id": 1,
      "move_number": 1,
      "player_color": "white",
      "move_notation": "e4",
      "board_state_fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    }
  ]
}
```

---

#### GET /api/games/active/current
Lấy game đang chơi của player hiện tại.

**Response:**
```json
{
  "success": true,
  "game": {
    "game_id": 1,
    "status": "playing",
    "white_player_id": 1,
    "black_player_id": 2
  }
}
```

---

#### GET /api/games/history/player
Lấy lịch sử game của player.

**Query Parameters:**
- `limit` (optional): Số lượng game hiển thị (default: 10)

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "game_id": 1,
      "game_mode": "normal",
      "status": "finished",
      "result": "white_win",
      "white_player_id": 1,
      "white_username": "test1",
      "black_player_id": 2,
      "black_username": "test2",
      "start_time": "2024-01-01T10:00:00.000Z",
      "end_time": "2024-01-01T10:30:00.000Z"
    }
  ]
}
```

---

#### GET /api/games/:gameId/moves
Lấy lịch sử nước đi của game.

**Response:**
```json
{
  "success": true,
  "moves": [
    {
      "move_id": 1,
      "move_number": 1,
      "player_color": "white",
      "move_notation": "e4",
      "board_state_fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      "create_at": "2024-01-01T10:00:05.000Z"
    }
  ]
}
```

---

## WebSocket Messages

### Connection
Kết nối WebSocket: `ws://localhost:3000?playerId={playerId}`

### Client → Server Messages

#### join_matchmaking
Vào hàng chờ tìm trận ranked.

```json
{
  "type": "join_matchmaking"
}
```

---

#### leave_matchmaking
Rời hàng chờ tìm trận.

```json
{
  "type": "leave_matchmaking"
}
```

---

#### accept_match
Chấp nhận trận đấu tìm được.

```json
{
  "type": "accept_match",
  "payload": {
    "matchId": "string"
  }
}
```

---

#### decline_match
Từ chối trận đấu.

```json
{
  "type": "decline_match",
  "payload": {
    "matchId": "string"
  }
}
```

---

#### room_ready
Cập nhật trạng thái sẵn sàng trong phòng.

```json
{
  "type": "room_ready",
  "payload": {
    "roomId": 1,
    "isReady": true
  }
}
```

---

#### start_game
Bắt đầu game (chỉ host).

```json
{
  "type": "start_game",
  "payload": {
    "roomId": 1
  }
}
```

---

#### invite_player
Mời player vào phòng.

```json
{
  "type": "invite_player",
  "payload": {
    "targetPlayerId": 2,
    "roomId": 1
  }
}
```

---

#### make_move
Thực hiện nước đi.

```json
{
  "type": "make_move",
  "payload": {
    "gameId": 1,
    "move": "e4",
    "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    "moveNumber": 1,
    "playerColor": "white"
  }
}
```

---

#### offer_draw
Đề nghị hòa.

```json
{
  "type": "offer_draw",
  "payload": {
    "gameId": 1
  }
}
```

---

#### accept_draw
Chấp nhận hòa.

```json
{
  "type": "accept_draw",
  "payload": {
    "gameId": 1
  }
}
```

---

#### resign
Đầu hàng.

```json
{
  "type": "resign",
  "payload": {
    "gameId": 1
  }
}
```

---

#### chat_message
Gửi tin nhắn chat.

```json
{
  "type": "chat_message",
  "payload": {
    "gameId": 1,
    "message": "Good game!"
  }
}
```

---

### Server → Client Messages

#### connected
Xác nhận kết nối thành công.

```json
{
  "type": "connected",
  "message": "Kết nối WebSocket thành công"
}
```

---

#### matchmaking_joined
Đã vào hàng chờ tìm trận.

```json
{
  "type": "matchmaking_joined",
  "message": "Đang tìm đối thủ...",
  "queueSize": 5
}
```

---

#### match_found
Tìm thấy trận đấu.

```json
{
  "type": "match_found",
  "matchId": "timestamp_player1_player2",
  "opponentId": 2
}
```

---

#### game_started
Game bắt đầu.

```json
{
  "type": "game_started",
  "gameId": 1,
  "roomId": 1,
  "whitePlayerId": 1,
  "blackPlayerId": 2,
  "isRanked": true,
  "gameMode": "normal",
  "timeSettings": {
    "time_initial_sec": 300,
    "per_move_max_sec": 60,
    "increment_sec": 3
  }
}
```

---

#### room_updated
Phòng được cập nhật.

```json
{
  "type": "room_updated",
  "room": {
    "id": 1,
    "host_ready": true,
    "guest_ready": false
  }
}
```

---

#### room_invitation
Lời mời vào phòng.

```json
{
  "type": "room_invitation",
  "roomId": 1,
  "fromPlayerId": 1
}
```

---

#### opponent_move
Nước đi của đối thủ.

```json
{
  "type": "opponent_move",
  "gameId": 1,
  "move": "e5",
  "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
  "moveNumber": 2,
  "playerColor": "black"
}
```

---

#### draw_offered
Đối thủ đề nghị hòa.

```json
{
  "type": "draw_offered",
  "gameId": 1,
  "fromPlayerId": 2
}
```

---

#### game_ended
Game kết thúc.

```json
{
  "type": "game_ended",
  "gameId": 1,
  "result": "white_win|black_win|draw",
  "reason": "checkmate|resignation|timeout|mutual_agreement"
}
```

---

#### chat_message
Tin nhắn chat từ đối thủ.

```json
{
  "type": "chat_message",
  "gameId": 1,
  "fromPlayerId": 2,
  "message": "Good game!",
  "timestamp": 1640000000000
}
```

---

#### error
Thông báo lỗi.

```json
{
  "type": "error",
  "message": "Lỗi mô tả"
}
```

---

## Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Error Handling

Tất cả API endpoints đều trả về format:

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```
