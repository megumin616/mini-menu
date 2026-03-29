// ===================================================
// 🌿 config/db.js - การตั้งค่าการเชื่อมต่อ Database
// ===================================================
// ใช้ mysql2/promise เพื่อรองรับ async/await
// createPool = สร้างกลุ่ม connection ที่พร้อมใช้งานพร้อมกัน
// (ดีกว่าสร้าง connection ใหม่ทุกครั้งที่มี request)

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool Config: กำหนดพฤติกรรมของ connection pool
const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            process.env.DB_PORT     || 3306,
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASSWORD || '',
  database:        process.env.DB_NAME     || 'cafe_garden',
  waitForConnections: true,   // รอ connection ว่าง ถ้า pool เต็ม
  connectionLimit:    10,     // connection สูงสุดพร้อมกัน 10 ตัว
  queueLimit:         0,      // 0 = รอได้ไม่จำกัด
  charset:        'utf8mb4',  // รองรับภาษาไทย + Emoji
});

// ทดสอบการเชื่อมต่อตอนเริ่มระบบ
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release(); // คืน connection กลับ pool
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // หยุดระบบถ้าต่อ DB ไม่ได้
  }
}

testConnection();

module.exports = pool;
