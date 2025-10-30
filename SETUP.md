# 🚀 Hướng dẫn Cài đặt Nhanh

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Thiết lập Database

### 2.1 Khởi động MySQL
Đảm bảo MySQL server đang chạy trên máy bạn.

### 2.2 Import Database Schema
```bash
mysql -u root -p < database/schema.sql
```

Hoặc sử dụng MySQL Workbench/phpMyAdmin để import file `database/schema.sql`

## Bước 3: Cấu hình Environment

### 3.1 Copy file cấu hình mẫu
```bash
cp .env.example .env
```

### 3.2 Chỉnh sửa file .env
Mở file `.env` và điền thông tin database của bạn:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chess_app

# Session Configuration
SESSION_SECRET=change_this_to_random_string
SESSION_MAX_AGE=86400000

# WebSocket Configuration
WS_PORT=3001
```

⚠️ **Lưu ý**: Thay `your_mysql_password` bằng mật khẩu MySQL thực tế của bạn.

## Bước 4: Chạy Ứng dụng

### Development mode (tự động reload khi có thay đổi):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## Bước 5: Truy cập Ứng dụng

Mở trình duyệt và truy cập:
```
http://localhost:3000
```

## ✅ Kiểm tra Cài đặt

Sau khi chạy ứng dụng, bạn sẽ thấy:

```
╔════════════════════════════════════════╗
║   🎮 Chess Online P2P Server          ║
║   ✅ HTTP Server: http://localhost:3000  ║
║   ✅ WebSocket Server: Ready           ║
╚════════════════════════════════════════╝
```

Và trong console sẽ có:
```
✅ Kết nối database thành công
```

## 🐛 Xử lý Lỗi Thường Gặp

### Lỗi: "Cannot find module"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: "Access denied for user"
- Kiểm tra username/password MySQL trong file `.env`
- Đảm bảo MySQL server đang chạy

### Lỗi: "Unknown database 'chess_app'"
- Chạy lại script import database:
```bash
mysql -u root -p < database/schema.sql
```

### Lỗi: "Port 3000 already in use"
- Thay đổi PORT trong file `.env` thành port khác (ví dụ: 3001, 8080)

## 📝 Test Đăng ký và Đăng nhập

1. Truy cập `http://localhost:3000`
2. Nhấn "Đăng nhập / Đăng ký"
3. Chọn tab "Đăng ký"
4. Điền thông tin:
   - Username: test1
   - Email: test1@example.com
   - Password: 123456
5. Nhấn "Đăng ký"
6. Đăng nhập với thông tin vừa tạo

## 🎮 Test Chơi Game

### Test với 2 tài khoản:

1. **Trình duyệt 1** (hoặc tab 1):
   - Đăng ký và đăng nhập: `test1`
   - Chọn "Custom Match"
   - Tạo phòng mới

2. **Trình duyệt 2** (hoặc cửa sổ ẩn danh):
   - Đăng ký và đăng nhập: `test2`
   - Chọn "Custom Match"
   - Tham gia phòng của test1

3. Cả 2 người chơi nhấn "Sẵn sàng"
4. Host (test1) nhấn "Bắt đầu game"
5. Chơi cờ!

## 🔧 Development Tips

### Xem logs real-time:
```bash
npm run dev
```

### Kiểm tra kết nối database:
```bash
mysql -u root -p -e "USE chess_app; SHOW TABLES;"
```

### Xem dữ liệu trong bảng:
```bash
mysql -u root -p -e "USE chess_app; SELECT * FROM tblPlayer;"
```

### Reset database (xóa toàn bộ dữ liệu):
```bash
mysql -u root -p -e "DROP DATABASE chess_app;"
mysql -u root -p < database/schema.sql
```

## 📱 Chạy trên mạng LAN

Để cho phép thiết bị khác trong mạng truy cập:

1. Tìm địa chỉ IP của máy:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` hoặc `ip addr`

2. Chỉnh sửa file `server/server.js`, thêm:
   ```javascript
   server.listen(PORT, '0.0.0.0', () => {
     console.log(`Server running on http://0.0.0.0:${PORT}`);
   });
   ```

3. Thiết bị khác truy cập: `http://[IP-của-máy-server]:3000`

## 🎯 Tiếp theo

Sau khi cài đặt thành công, đọc file `README.md` để biết:
- Chi tiết cấu trúc dự án
- API endpoints
- WebSocket messages
- Hướng dẫn sử dụng đầy đủ

---

**Chúc bạn cài đặt thành công! 🎉**
