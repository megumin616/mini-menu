// ===================================================
// 🌿 routes/menuRoutes.js
// ===================================================
const express        = require('express');
const router         = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken } = require('../middlewares/auth');

// เมนูต้องล็อกอินก่อน (ต้องมี JWT Token ของโต๊ะหรือพนักงาน)
router.use(verifyToken);

// GET /api/menus                  → เมนูทั้งหมด
router.get('/', menuController.getAllMenus);

// GET /api/menus/categories       → หมวดหมู่ทั้งหมด
router.get('/categories', menuController.getAllCategories);

// GET /api/menus/category/:id     → เมนูตาม category
router.get('/category/:id', menuController.getMenusByCategory);

// GET /api/menus/:id              → เมนูชิ้นเดียว
router.get('/:id', menuController.getMenuById);

module.exports = router;
