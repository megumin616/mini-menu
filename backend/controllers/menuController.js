// ===================================================
// 🌿 controllers/menuController.js
// ===================================================

const menuService = require('../services/menuService');

// GET /api/menus - ดึงเมนูทั้งหมด
const getAllMenus = async (req, res) => {
  try {
    const menus = await menuService.getAllMenus();
    res.json({ success: true, data: menus, message: 'ดึงข้อมูลเมนูสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menus/categories - ดึงหมวดหมู่ทั้งหมด
const getAllCategories = async (req, res) => {
  try {
    const categories = await menuService.getAllCategories();
    res.json({ success: true, data: categories, message: 'ดึงหมวดหมู่สำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/menus/categories - สร้างหมวดหมู่ (ADMIN)
const createCategory = async (req, res) => {
  try {
    const { name, icon, sortOrder } = req.body;
    const created = await menuService.createCategory({ name, icon, sortOrder });
    res.status(201).json({ success: true, data: created, message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/menus/categories/:id - แก้ไขหมวดหมู่ (ADMIN)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, sortOrder } = req.body;
    const updated = await menuService.updateCategory(parseInt(id), { name, icon, sortOrder });
    res.json({ success: true, data: updated, message: 'แก้ไขหมวดหมู่สำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/menus/categories/:id - ลบหมวดหมู่ (ADMIN)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await menuService.deleteCategory(parseInt(id));
    res.json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/menus/category/:id - ดึงเมนูตาม category
const getMenusByCategory = async (req, res) => {
  try {
    const menus = await menuService.getMenusByCategory(req.params.id);
    res.json({ success: true, data: menus, message: 'ดึงเมนูตามหมวดหมู่สำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menus/:id - ดึงเมนูชิ้นเดียว
const getMenuById = async (req, res) => {
  try {
    const menu = await menuService.getMenuById(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, message: 'ไม่พบเมนูนี้' });
    }
    res.json({ success: true, data: menu, message: 'ดึงข้อมูลเมนูสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/menus - สร้างเมนู (ADMIN)
const createMenuItem = async (req, res) => {
  try {
    const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;
    const created = await menuService.createMenuItem({
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable
    });
    res.status(201).json({ success: true, data: created, message: 'เพิ่มเมนูสำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/menus/:id - แก้ไขเมนู (ADMIN)
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;
    const updated = await menuService.updateMenuItem(parseInt(id), {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable
    });
    res.json({ success: true, data: updated, message: 'แก้ไขเมนูสำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/menus/:id - ลบเมนู (ADMIN)
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    await menuService.deleteMenuItem(parseInt(id));
    res.json({ success: true, message: 'ลบเมนูสำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllMenus,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenusByCategory,
  getMenuById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
