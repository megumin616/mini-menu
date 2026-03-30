// ===================================================
// 🌿 routes/authRoutes.js
// ===================================================
const express         = require('express');
const router          = express.Router();
const authController  = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

// POST /api/auth/table-login  → ลูกค้ากรอกเลขโต๊ะ
router.post('/table-login', authController.tableLogin);

// POST /api/auth/staff-login  → พนักงาน Login
router.post('/staff-login', authController.staffLogin);

// GET  /api/auth/verify       → ตรวจสอบ Token (ต้องมี Token)
router.get('/verify', verifyToken, authController.verifyToken);

module.exports = router;
