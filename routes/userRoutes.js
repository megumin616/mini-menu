// ===================================================
// 🌿 routes/userRoutes.js
// ===================================================
const express        = require('express');
const router         = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.post('/staff', verifyToken, checkRole(['ADMIN']), userController.createStaff);

module.exports = router;
