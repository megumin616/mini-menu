// ===================================================
// 🌿 services/authService.js - Business Logic ของ Authentication
// ===================================================
// Service Layer: เก็บ logic การทำงานจริง
// Controller จะเรียก Service → Service จะเรียก DB

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ===================================================
// tableLogin: ลูกค้ากรอกเลขโต๊ะเพื่อรับ Token
// ===================================================
// Flow: กรอกเลข → ตรวจสอบว่าโต๊ะมีอยู่ไหม → สร้าง JWT → คืน Token
async function tableLogin(tableNumber) {
  // ดึงข้อมูลโต๊ะจาก Database
  const [rows] = await db.query(
    'SELECT * FROM tables WHERE table_number = ?',
    [tableNumber]
  );

  if (rows.length === 0) {
    throw new Error('ไม่พบโต๊ะหมายเลข ' + tableNumber);
  }

  const table = rows[0];

  // สร้าง JWT Token สำหรับโต๊ะนี้
  // Payload (ข้อมูลที่ฝังใน Token):
  //   - role: 'TABLE' บอกว่าเป็น token ของลูกค้า ไม่ใช่พนักงาน
  //   - tableId: id ของโต๊ะใน Database
  //   - tableNumber: เลขโต๊ะที่แสดงให้ลูกค้าเห็น
  const token = jwt.sign(
    {
      role:        'TABLE',
      tableId:     table.id,
      tableNumber: table.table_number
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    // Token หมดอายุใน 8 ชั่วโมง (เพียงพอสำหรับการนั่งทานในร้าน)
  );

  // อัปเดตสถานะโต๊ะเป็น OCCUPIED (มีลูกค้าแล้ว)
  await db.query(
    "UPDATE tables SET status = 'OCCUPIED' WHERE id = ?",
    [table.id]
  );

  return {
    token,
    table: {
      id:          table.id,
      tableNumber: table.table_number,
      status:      'OCCUPIED'
    }
  };
}

// ===================================================
// staffLogin: พนักงาน Login ด้วย username/password
// ===================================================
// Flow: ส่ง username+password → ค้นหา user → ตรวจ password ด้วย bcrypt → สร้าง JWT
async function staffLogin(username, password) {
  // ค้นหา user จาก Database
  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
    [username]
  );

  if (rows.length === 0) {
    throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบ');
  }

  const user = rows[0];

  // bcrypt.compare(): เปรียบเทียบ password ที่กรอก กับ hash ใน DB
  // ทำไมไม่เก็บ password ตรงๆ?
  // → ถ้า DB โดน hack ก็ยังไม่รู้รหัสผ่านจริง
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  // สร้าง JWT Token สำหรับพนักงาน
  const token = jwt.sign(
    {
      userId:   user.id,
      username: user.username,
      role:     user.role,       // 'STAFF' หรือ 'ADMIN'
      fullName: user.full_name
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: {
      id:       user.id,
      username: user.username,
      fullName: user.full_name,
      role:     user.role
    }
  };
}

module.exports = { tableLogin, staffLogin };
