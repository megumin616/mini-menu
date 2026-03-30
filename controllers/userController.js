// ===================================================
// 🌿 controllers/userController.js
// ===================================================

const userService = require('../services/userService');

const createStaff = async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    const created = await userService.createStaff({
      username,
      password,
      fullName,
      role: role || 'STAFF'
    });
    res.status(201).json({
      success: true,
      data:    created,
      message: `เพิ่ม ${created.fullName} เรียบร้อยแล้ว`
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { createStaff };
