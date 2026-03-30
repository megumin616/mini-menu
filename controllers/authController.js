// ===================================================
// 🌿 controllers/authController.js - จัดการ Request/Response
// ===================================================
// Controller ทำหน้าที่:
//   1. รับ Request จาก Route
//   2. ตรวจสอบ Input เบื้องต้น (Validation)
//   3. เรียก Service เพื่อทำงาน
//   4. ส่ง Response กลับ Frontend
// (ไม่ควรมี DB logic ใน Controller)

const authService = require('../services/authService');

// POST /api/auth/table-login
// ลูกค้ากรอกเลขโต๊ะเพื่อรับ JWT Token
const tableLogin = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    // Validation: ตรวจสอบว่ากรอกเลขโต๊ะมาหรือยัง
    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกหมายเลขโต๊ะ'
      });
    }

    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'หมายเลขโต๊ะต้องเป็นตัวเลขที่ถูกต้อง'
      });
    }

    // เรียก Service ทำงาน
    const result = await authService.tableLogin(tableNum);

    // ส่ง Response กลับ Frontend พร้อม Token
    res.json({
      success: true,
      data:    result,
      message: `ยินดีต้อนรับสู่โต๊ะที่ ${tableNum} 🌿`
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// POST /api/auth/staff-login
// พนักงาน Login ด้วย username + password
const staffLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก Username และ Password'
      });
    }

    const result = await authService.staffLogin(username, password);

    res.json({
      success: true,
      data:    result,
      message: `ยินดีต้อนรับ ${result.user.fullName} 👋`
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message
    });
  }
};

// GET /api/auth/verify
// ตรวจสอบว่า Token ยังใช้งานได้ (Frontend เรียกตอน refresh หน้า)
const verifyToken = (req, res) => {
  // req.user ถูกแนบมาจาก middleware verifyToken แล้ว
  res.json({
    success: true,
    data:    req.user,
    message: 'Token ถูกต้อง'
  });
};

module.exports = { tableLogin, staffLogin, verifyToken };
