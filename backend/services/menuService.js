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

// ===================================================
// ADMIN CRUD: categories
// ===================================================
async function createCategory({ name, icon, sortOrder }) {
  const n = String(name || '').trim();
  if (!n) throw new Error('กรุณากรอกชื่อหมวดหมู่');

  const ic = icon == null ? '🍽️' : String(icon).trim();
  const so = sortOrder == null || sortOrder === '' ? 0 : parseInt(sortOrder);
  if (Number.isNaN(so)) throw new Error('sortOrder ต้องเป็นตัวเลข');

  const [dup] = await db.query('SELECT id FROM categories WHERE name = ?', [n]);
  if (dup.length > 0) throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้ว');

  const [result] = await db.query(
    'INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)',
    [n, ic, so]
  );

  return { id: result.insertId, name: n, icon: ic, sort_order: so };
}

async function updateCategory(categoryId, { name, icon, sortOrder }) {
  if (!Number.isInteger(categoryId)) throw new Error('categoryId ไม่ถูกต้อง');

  const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
  if (existing.length === 0) throw new Error('ไม่พบหมวดหมู่นี้');

  const current = existing[0];
  const n = name == null ? current.name : String(name).trim();
  if (!n) throw new Error('กรุณากรอกชื่อหมวดหมู่');

  const ic = icon == null ? current.icon : String(icon).trim();
  const so = sortOrder == null || sortOrder === '' ? current.sort_order : parseInt(sortOrder);
  if (Number.isNaN(so)) throw new Error('sortOrder ต้องเป็นตัวเลข');

  const [dup] = await db.query('SELECT id FROM categories WHERE name = ? AND id <> ?', [n, categoryId]);
  if (dup.length > 0) throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้ว');

  await db.query('UPDATE categories SET name = ?, icon = ?, sort_order = ? WHERE id = ?', [n, ic, so, categoryId]);
  return { id: categoryId, name: n, icon: ic, sort_order: so };
}

async function deleteCategory(categoryId) {
  if (!Number.isInteger(categoryId)) throw new Error('categoryId ไม่ถูกต้อง');
  const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
  if (result.affectedRows === 0) throw new Error('ไม่พบหมวดหมู่นี้');
  return true;
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

// ===================================================
// ADMIN CRUD: menu_items
// ===================================================
async function createMenuItem({ categoryId, name, description, price, imageUrl, isAvailable }) {
  const cid = parseInt(categoryId);
  if (Number.isNaN(cid) || cid < 1) throw new Error('กรุณาระบุ categoryId ที่ถูกต้อง');

  const n = String(name || '').trim();
  if (!n) throw new Error('กรุณากรอกชื่อเมนู');

  const p = Number(price);
  if (!Number.isFinite(p) || p < 0) throw new Error('กรุณาระบุราคาให้ถูกต้อง');

  const desc = description == null ? null : String(description);
  const img  = imageUrl == null || String(imageUrl).trim() === '' ? null : String(imageUrl).trim();
  const avail = isAvailable == null ? true : Boolean(isAvailable);

  // ตรวจสอบ category มีอยู่จริง
  const [cat] = await db.query('SELECT id FROM categories WHERE id = ?', [cid]);
  if (cat.length === 0) throw new Error('ไม่พบหมวดหมู่ที่เลือก');

  const [result] = await db.query(
    'INSERT INTO menu_items (category_id, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)',
    [cid, n, desc, p, img, avail]
  );

  return {
    id: result.insertId,
    category_id: cid,
    name: n,
    description: desc,
    price: p,
    image_url: img,
    is_available: avail
  };
}

async function updateMenuItem(menuItemId, { categoryId, name, description, price, imageUrl, isAvailable }) {
  if (!Number.isInteger(menuItemId)) throw new Error('id ไม่ถูกต้อง');

  const [existing] = await db.query('SELECT * FROM menu_items WHERE id = ?', [menuItemId]);
  if (existing.length === 0) throw new Error('ไม่พบเมนูนี้');
  const current = existing[0];

  const cid = categoryId == null ? current.category_id : parseInt(categoryId);
  if (Number.isNaN(cid) || cid < 1) throw new Error('กรุณาระบุ categoryId ที่ถูกต้อง');

  const n = name == null ? current.name : String(name).trim();
  if (!n) throw new Error('กรุณากรอกชื่อเมนู');

  const p = price == null ? Number(current.price) : Number(price);
  if (!Number.isFinite(p) || p < 0) throw new Error('กรุณาระบุราคาให้ถูกต้อง');

  const desc = description === undefined ? current.description : (description == null ? null : String(description));
  const img  = imageUrl === undefined ? current.image_url : (imageUrl == null || String(imageUrl).trim() === '' ? null : String(imageUrl).trim());
  const avail = isAvailable === undefined ? Boolean(current.is_available) : Boolean(isAvailable);

  const [cat] = await db.query('SELECT id FROM categories WHERE id = ?', [cid]);
  if (cat.length === 0) throw new Error('ไม่พบหมวดหมู่ที่เลือก');

  await db.query(
    'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ? WHERE id = ?',
    [cid, n, desc, p, img, avail, menuItemId]
  );

  return {
    id: menuItemId,
    category_id: cid,
    name: n,
    description: desc,
    price: p,
    image_url: img,
    is_available: avail
  };
}

async function deleteMenuItem(menuItemId) {
  if (!Number.isInteger(menuItemId)) throw new Error('id ไม่ถูกต้อง');
  const [result] = await db.query('DELETE FROM menu_items WHERE id = ?', [menuItemId]);
  if (result.affectedRows === 0) throw new Error('ไม่พบเมนูนี้');
  return true;
}

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
