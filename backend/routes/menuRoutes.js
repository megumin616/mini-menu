// ===================================================
// 🌿 routes/menuRoutes.js
// ===================================================
const express        = require('express');
const router         = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// เมนูต้องล็อกอินก่อน (ต้องมี JWT Token ของโต๊ะหรือพนักงาน)
router.use(verifyToken);

// GET /api/menus                  → เมนูทั้งหมด
router.get('/', menuController.getAllMenus);

// GET /api/menus/categories       → หมวดหมู่ทั้งหมด
router.get('/categories', menuController.getAllCategories);

// ==========================
// ADMIN CRUD: categories
// ==========================
// POST /api/menus/categories
router.post('/categories', checkRole(['ADMIN']), menuController.createCategory);
// PUT /api/menus/categories/:id
router.put('/categories/:id', checkRole(['ADMIN']), menuController.updateCategory);
// DELETE /api/menus/categories/:id
router.delete('/categories/:id', checkRole(['ADMIN']), menuController.deleteCategory);

// GET /api/menus/category/:id     → เมนูตาม category
router.get('/category/:id', menuController.getMenusByCategory);

// GET /api/menus/:id              → เมนูชิ้นเดียว
router.get('/:id', menuController.getMenuById);

// ==========================
// ADMIN CRUD: menu_items
// ==========================
// POST /api/menus
router.post('/', checkRole(['ADMIN']), menuController.createMenuItem);
// PUT /api/menus/:id
router.put('/:id', checkRole(['ADMIN']), menuController.updateMenuItem);
// DELETE /api/menus/:id
router.delete('/:id', checkRole(['ADMIN']), menuController.deleteMenuItem);

module.exports = router;
