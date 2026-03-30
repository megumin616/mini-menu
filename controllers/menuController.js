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

module.exports = { getAllMenus, getAllCategories, getMenusByCategory, getMenuById };
