// ===================================================
// 🌿 services/userService.js - จัดการบัญชีพนักงาน (users)
// ===================================================

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const SALT_ROUNDS = 10;

async function createStaff({ username, password, fullName, role }) {
  if (!username || !password || !fullName) {
    throw new Error('กรุณากรอก Username รหัสผ่าน และชื่อ-นามสกุล');
  }
  if (String(password).length < 6) {
    throw new Error('รหัสผ่านควรมีอย่างน้อย 6 ตัวอักษร');
  }
  const r = role || 'STAFF';
  if (!['STAFF', 'ADMIN'].includes(r)) {
    throw new Error('บทบาทไม่ถูกต้อง');
  }

  const u = String(username).trim();
  const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [u]);
  if (existing.length > 0) {
    throw new Error('Username นี้ถูกใช้แล้ว');
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await db.query(
    'INSERT INTO users (username, password, full_name, role, is_active) VALUES (?, ?, ?, ?, TRUE)',
    [u, hash, String(fullName).trim(), r]
  );

  return {
    id:       result.insertId,
    username: u,
    fullName: String(fullName).trim(),
    role:     r
  };
}

module.exports = { createStaff };
