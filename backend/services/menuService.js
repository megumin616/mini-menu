// ===================================================
// 🌿 services/menuService.js - Business Logic ของเมนูอาหาร
// ===================================================

const db = require('../config/db');

// ดึงเมนูทั้งหมด พร้อมข้อมูล category
// ใช้ JOIN เพื่อรวมข้อมูลจาก 2 ตาราง (menu_items + categories)
async function getAllMenus() {
  const [rows] = await db.query(`
    SELECT
      m.id,
      m.name,
      m.description,
      m.price,
      m.image_url,
      m.is_available,
      c.id   AS category_id,
      c.name AS category_name,
      c.icon AS category_icon
    FROM menu_items m
    JOIN categories c ON m.category_id = c.id
    WHERE m.is_available = TRUE
    ORDER BY c.sort_order, m.name
  `);
  return rows;
}

// ดึงหมวดหมู่ทั้งหมด (สำหรับ Navbar)
async function getAllCategories() {
  const [rows] = await db.query(
    'SELECT * FROM categories ORDER BY sort_order'
  );
  return rows;
}

// ดึงเมนูตาม category
async function getMenusByCategory(categoryId) {
  const [rows] = await db.query(
    `SELECT m.*, c.name AS category_name, c.icon AS category_icon
     FROM menu_items m
     JOIN categories c ON m.category_id = c.id
     WHERE m.category_id = ? AND m.is_available = TRUE
     ORDER BY m.name`,
    [categoryId]
  );
  return rows;
}

// ดึงเมนูชิ้นเดียว (สำหรับหน้า detail)
async function getMenuById(id) {
  const [rows] = await db.query(
    `SELECT m.*, c.name AS category_name
     FROM menu_items m
     JOIN categories c ON m.category_id = c.id
     WHERE m.id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { getAllMenus, getAllCategories, getMenusByCategory, getMenuById };
