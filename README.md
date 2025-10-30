# ♟️ Chess Online P2P

Ứng dụng chơi cờ vua trực tuyến với chế độ P2P (Player vs Player) sử dụng WebSocket cho giao tiếp thời gian thực.

## 📋 Tính năng

### Chế độ chơi
- **Ranking Match**: Tìm đối thủ tự động dựa trên điểm số (chênh lệch ≤ 50 điểm)
- **Custom Match**: Tạo hoặc tham gia phòng với cài đặt tùy chỉnh

### Tính năng game
- Bàn cờ tương tác với drag-and-drop (sử dụng chessboard.js)
- Xác thực nước đi hợp lệ (sử dụng chess.js)
- Đồng bộ thời gian thực qua WebSocket
- Hệ thống thời gian:
  - **Normal**: Giới hạn thời gian mỗi nước đi
  - **Blitz**: Tổng thời gian + thời gian tăng mỗi nước
- Lịch sử nước đi
- Chat trong game
- Đề nghị hòa
- Đầu hàng

### Hệ thống xếp hạng
- Theo dõi thống kê: Thắng/Thua/Hòa
- Hệ thống điểm:
  - Thắng: +3 điểm
  - Hòa: +1 điểm
  - Thua: +0 điểm
- Bảng xếp hạng

### Quản lý phòng
- Tạo phòng công khai hoặc riêng tư (có mật khẩu)
- Hệ thống sẵn sàng cho cả hai người chơi
- Danh sách phòng đang chờ
- Mời người chơi online vào phòng
- Mã phòng duy nhất (6 ký tự)

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** + **Express**: Server framework
- **ws**: WebSocket library
- **MySQL**: Database
- **bcrypt**: Mã hóa mật khẩu
- **express-session**: Quản lý session
- **dotenv**: Quản lý biến môi trường

### Frontend
- **HTML5/CSS3/JavaScript**: Giao diện
- **chess.js**: Logic cờ vua và xác thực nước đi
- **chessboard.js**: Hiển thị bàn cờ tương tác
- **WebSocket API**: Kết nối thời gian thực

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 14.x
- MySQL >= 5.7
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd chess-online-p2p
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Thiết lập database
1. Tạo database MySQL:
```bash
mysql -u root -p < database/schema.sql
```

2. Database sẽ tự động tạo các bảng:
   - `tblPlayer`: Thông tin người chơi
   - `tblPlayerStats`: Thống kê người chơi
   - `tblRoom`: Phòng chơi
   - `tblGame`: Thông tin game
   - `tblGamemove`: Lịch sử nước đi

### Bước 4: Cấu hình môi trường
Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chess_app

# Session Configuration
SESSION_SECRET=your_session_secret_key_here
SESSION_MAX_AGE=86400000

# WebSocket Configuration
WS_PORT=3001
```

### Bước 5: Chạy ứng dụng

#### Development mode (với nodemon):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc thư mục

```
chess-online-p2p/
├── server/
│   ├── config/
│   │   └── database.js          # Kết nối MySQL
│   ├── dao/
│   │   ├── PlayerDAO.js         # CRUD người chơi
│   │   ├── PlayerStatsDAO.js    # Quản lý thống kê
│   │   ├── RoomDAO.js           # Quản lý phòng
│   │   ├── GameDAO.js           # Quản lý game
│   │   └── GameMoveDAO.js       # Quản lý nước đi
│   ├── services/
│   │   ├── AuthService.js       # Xác thực
│   │   ├── MatchmakingService.js # Tìm trận
│   │   ├── RoomService.js       # Logic phòng
│   │   └── GameService.js       # Logic game
│   ├── websocket/
│   │   ├── WebSocketServer.js   # WebSocket server
│   │   └── handlers/
│   │       ├── matchmakingHandler.js
│   │       ├── roomHandler.js
│   │       └── gameHandler.js
│   ├── routes/
│   │   ├── authRoutes.js        # API đăng nhập/đăng ký
│   │   ├── playerRoutes.js      # API người chơi
│   │   ├── roomRoutes.js        # API phòng
│   │   └── gameRoutes.js        # API game
│   ├── middleware/
│   │   └── authMiddleware.js    # Middleware xác thực
│   └── server.js                # Entry point
├── client/
│   ├── css/
│   │   └── styles.css           # Styles
│   ├── js/
│   │   ├── websocket.js         # WebSocket client
│   │   ├── matchmaking.js       # Logic matchmaking
│   │   ├── room.js              # Logic phòng
│   │   ├── game.js              # Logic game
│   │   └── main.js              # Utilities
│   ├── pages/
│   │   ├── login.html           # Trang đăng nhập
│   │   ├── play-mode.html       # Chọn chế độ chơi
│   │   ├── ranking.html         # Matchmaking
│   │   ├── custom-lobby.html    # Lobby custom
│   │   ├── room-detail.html     # Chi tiết phòng
│   │   └── game-board.html      # Bàn cờ
│   └── index.html               # Trang chủ
├── database/
│   └── schema.sql               # Database schema
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🎮 Hướng dẫn sử dụng

### 1. Đăng ký và Đăng nhập
- Truy cập `http://localhost:3000`
- Nhấn "Đăng nhập / Đăng ký"
- Tạo tài khoản mới hoặc đăng nhập với tài khoản có sẵn

### 2. Chơi Ranking Match
1. Chọn "Ranking Match"
2. Nhấn "Bắt đầu tìm trận"
3. Hệ thống sẽ tìm đối thủ có điểm chênh lệch ≤ 50
4. Chấp nhận trận đấu trong 30 giây
5. Game bắt đầu khi cả hai đã chấp nhận

### 3. Chơi Custom Match
1. Chọn "Custom Match"

#### Tạo phòng:
1. Điền thông tin:
   - Tên phòng
   - Loại: Public/Private
   - Mật khẩu (nếu Private)
   - Chế độ: Normal/Blitz
   - Cài đặt thời gian
2. Nhấn "Tạo phòng"
3. Đợi người chơi tham gia
4. Cả hai nhấn "Sẵn sàng"
5. Host nhấn "Bắt đầu game"

#### Tham gia phòng:
1. Chọn phòng từ danh sách
2. Nhập mật khẩu (nếu phòng Private)
3. Nhấn "Sẵn sàng"
4. Chờ host bắt đầu

### 4. Trong game
- **Di chuyển quân**: Kéo và thả quân cờ
- **Đề nghị hòa**: Nhấn nút "Đề nghị hòa"
- **Đầu hàng**: Nhấn nút "Đầu hàng"
- **Chat**: Gõ tin nhắn và nhấn Enter hoặc nút "Gửi"
- **Lịch sử**: Xem các nước đi trong panel bên phải

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/check-session` - Kiểm tra session

### Players
- `GET /api/players/:playerId` - Lấy thông tin player
- `GET /api/players/:playerId/stats` - Lấy thống kê player
- `GET /api/players/online/list` - Danh sách player online
- `GET /api/players/leaderboard/top` - Bảng xếp hạng

### Rooms
- `POST /api/rooms/create` - Tạo phòng
- `GET /api/rooms/waiting` - Danh sách phòng chờ
- `POST /api/rooms/:roomId/join` - Tham gia phòng
- `POST /api/rooms/:roomId/leave` - Rời phòng
- `GET /api/rooms/:roomId` - Thông tin phòng

### Games
- `GET /api/games/:gameId` - Thông tin game
- `GET /api/games/active/current` - Game đang chơi
- `GET /api/games/history/player` - Lịch sử game
- `GET /api/games/:gameId/moves` - Lịch sử nước đi

## 📡 WebSocket Messages

### Client → Server
- `join_matchmaking` - Vào hàng chờ ranking
- `leave_matchmaking` - Rời hàng chờ
- `accept_match` - Chấp nhận trận đấu
- `decline_match` - Từ chối trận đấu
- `room_ready` - Cập nhật trạng thái sẵn sàng
- `start_game` - Bắt đầu game (host)
- `invite_player` - Mời người chơi
- `make_move` - Thực hiện nước đi
- `offer_draw` - Đề nghị hòa
- `accept_draw` - Chấp nhận hòa
- `resign` - Đầu hàng
- `chat_message` - Gửi tin nhắn

### Server → Client
- `connected` - Kết nối thành công
- `matchmaking_joined` - Đã vào hàng chờ
- `match_found` - Tìm thấy trận đấu
- `game_started` - Game bắt đầu
- `room_updated` - Phòng cập nhật
- `room_invitation` - Lời mời vào phòng
- `opponent_move` - Nước đi của đối thủ
- `draw_offered` - Đề nghị hòa
- `game_ended` - Game kết thúc
- `chat_message` - Tin nhắn chat
- `error` - Lỗi

## 🔧 Troubleshooting

### Lỗi kết nối database
```
❌ Lỗi kết nối database: Access denied
```
**Giải pháp**: Kiểm tra thông tin đăng nhập MySQL trong file `.env`

### Lỗi WebSocket
```
WebSocket connection failed
```
**Giải pháp**: 
- Kiểm tra server đang chạy
- Kiểm tra firewall không chặn WebSocket
- Xóa cache browser và thử lại

### Lỗi session
```
Vui lòng đăng nhập
```
**Giải pháp**: Xóa cookies và đăng nhập lại

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

ISC License

## 👥 Tác giả

Dự án được phát triển như một ứng dụng demo cho hệ thống chơi cờ vua trực tuyến P2P.

## 📞 Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng tạo issue trên GitHub.

---

**Chúc bạn chơi vui vẻ! ♟️**
