// ===================================================
// 🌿 app.js - จุดเริ่มต้นของ Backend Server
// ===================================================
// นี่คือไฟล์แรกที่ Node.js อ่านเมื่อสั่ง "npm start"
// ทำหน้าที่:
//   1. ตั้งค่า Express App
//   2. เชื่อม Middleware ต่างๆ
//   3. กำหนด Route (ว่า URL ไหนไปหา Controller ไหน)
//   4. เปิด Server ฟัง Port ที่กำหนด

require('dotenv').config(); // โหลดตัวแปร environment จากไฟล์ .env

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ===================================================
// Middleware: ซอฟต์แวร์ที่ทำงานระหว่าง Request → Response
// ===================================================

// CORS: อนุญาตให้ Frontend (คนละ domain) เรียก API ได้
// ในระบบ Production ควรกำหนด origin ให้เฉพาะเจาะจง
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON Parser: แปลง request body จาก JSON string → JS Object
// ทำให้เข้าถึงข้อมูลได้ผ่าน req.body
app.use(express.json());

// URL-encoded Parser: รองรับ form submit แบบ HTML form
app.use(express.urlencoded({ extended: true }));

// Static Files: เสิร์ฟไฟล์ Frontend จาก folder /frontend
// ทำให้เข้าถึง http://localhost:3000/index.html ได้โดยตรง
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ===================================================
// Routes: กำหนดว่า URL pattern ไหน → ไปหา Router ไหน
// ===================================================
app.use('/api/auth',   require('./routes/authRoutes'));
app.use('/api/menus',  require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// ===================================================
// Health Check: ตรวจสอบว่า Server ทำงานอยู่
// ===================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🌿 Cafe In The Garden API is running!',
    timestamp: new Date().toISOString()
  });
});

// ===================================================
// 404 Handler: จัดการ URL ที่ไม่มีใน Route
// ===================================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `ไม่พบ Route: ${req.method} ${req.originalUrl}`
  });
});

// Fallback: ส่ง index.html สำหรับ route อื่นๆ (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ===================================================
// Global Error Handler
// ===================================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดภายใน Server'
  });
});

// ===================================================
// เริ่มต้น Server
// ===================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('🌿 ================================================');
  console.log(`🌿  Cafe In The Garden Server Started!`);
  console.log(`🌿  URL: http://localhost:${PORT}`);
  console.log(`🌿  ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('🌿 ================================================');
  console.log('');
});

module.exports = app;
