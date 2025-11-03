const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool kết nối database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  namedPlaceholders: true
});

// Test kết nối
pool.getConnection()
  .then(connection => {
    console.log('✅ Kết nối database thành công');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối database:', err.message);
  });

module.exports = pool;
