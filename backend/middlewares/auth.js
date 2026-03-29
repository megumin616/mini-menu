// ===================================================
// 🌿 middlewares/auth.js - ระบบตรวจสอบสิทธิ์
// ===================================================
//
// 📌 JWT ทำงานอย่างไรในบริบทของ "โต๊ะอาหาร":
//
// 1. ลูกค้ากรอกเลขโต๊ะ (เช่น โต๊ะ 5)
// 2. Backend สร้าง JWT Token ที่มีข้อมูลฝังอยู่ข้างใน:
//    { role: 'TABLE', tableId: 5, tableNumber: 5 }
// 3. Frontend เก็บ Token ใน localStorage
// 4. ทุกครั้งที่เรียก API → ส่ง Token ใน Header:
//    Authorization: Bearer <token>
// 5. Middleware ตรวจสอบ Token:
//    - ถูกต้องไหม? (ลายเซ็นตรงไหม)
//    - หมดอายุหรือยัง?
//    - มีสิทธิ์เข้าถึง route นี้ไหม?
//
// ✅ ข้อดีของ JWT: ไม่ต้องเก็บ session บน server
//    Token มีข้อมูลครบในตัวเอง (Self-contained)

const jwt = require('jsonwebtoken');

// ===================================================
// verifyToken: ตรวจสอบว่า Token ถูกต้องหรือไม่
// ===================================================
const verifyToken = (req, res, next) => {
  // ดึง Token จาก Authorization Header
  // รูปแบบ: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบก่อน (ไม่พบ Token)'
    });
  }

  // แยกเอาแค่ Token ออกจาก "Bearer ..."
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify() ทำ 2 อย่าง:
    // 1. ถอดรหัส (Decode) Token
    // 2. ตรวจสอบลายเซ็น (Verify Signature) ว่าไม่ถูกแก้ไข
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // แนบข้อมูลผู้ใช้ไปกับ request object
    // เพื่อให้ controller นำไปใช้ต่อได้
    req.user = decoded;
    next(); // ผ่าน! ไปทำงานต่อได้
  } catch (err) {
    // TokenExpiredError = Token หมดอายุ
    // JsonWebTokenError  = Token ถูกแก้ไข / ผิดรูปแบบ
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }
};

// ===================================================
// checkRole: ตรวจสอบสิทธิ์ตาม Role
// ===================================================
// ใช้แบบ Higher-Order Function (ฟังก์ชันที่คืนค่าเป็นฟังก์ชัน)
// ตัวอย่างการใช้: router.get('/kitchen', verifyToken, checkRole(['STAFF','ADMIN']), ...)
//
// Role ที่มีในระบบ:
//   TABLE = ลูกค้าที่กรอกเลขโต๊ะ (สั่งอาหารได้ ดูสถานะได้)
//   STAFF = พนักงาน (จัดการออเดอร์ได้ ดูครัวได้)
//   ADMIN = ผู้ดูแล (ทำได้ทุกอย่าง)
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // req.user ถูกแนบมาจาก verifyToken ก่อนหน้า
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
      });
    }
    next();
  };
};

// ===================================================
// checkTableOwnership: ตรวจสอบว่าลูกค้าเข้าถึงโต๊ะของตัวเองเท่านั้น
// ===================================================
// ป้องกันลูกค้าโต๊ะ 1 เข้าไปดูหรือแก้ไขออเดอร์ของโต๊ะ 2
const checkTableOwnership = (req, res, next) => {
  const requestedTableId = parseInt(req.params.tableId || req.body.tableId);

  // STAFF และ ADMIN ผ่านได้เลย
  if (req.user.role === 'STAFF' || req.user.role === 'ADMIN') {
    return next();
  }

  // TABLE ต้องตรงกับโต๊ะตัวเอง
  if (req.user.role === 'TABLE' && req.user.tableId === requestedTableId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลโต๊ะนี้'
  });
};

module.exports = { verifyToken, checkRole, checkTableOwnership };
