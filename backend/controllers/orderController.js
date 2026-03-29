// ===================================================
// 🌿 controllers/orderController.js
// ===================================================

const orderService = require('../services/orderService');

// POST /api/orders - ลูกค้าสั่งอาหาร
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    // tableId มาจาก JWT Token ที่ถอดรหัสแล้ว (req.user.tableId)
    const tableId = req.user.tableId;

    // ตรวจสอบว่ามีรายการอาหารอย่างน้อย 1 รายการ
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกอาหารอย่างน้อย 1 รายการ'
      });
    }

    // ตรวจสอบ format ของแต่ละรายการ
    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'ข้อมูลรายการอาหารไม่ถูกต้อง'
        });
      }
    }

    const result = await orderService.createOrder(tableId, items);
    res.status(201).json({
      success: true,
      data:    result,
      message: 'ส่งออเดอร์ไปยังครัวแล้ว! 🍳'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/my-order - ลูกค้าดูออเดอร์ของตัวเอง
const getMyOrder = async (req, res) => {
  try {
    const tableId = req.user.tableId;
    const order   = await orderService.getOrderByTable(tableId);

    res.json({
      success: true,
      data:    order,
      message: order ? 'ดึงข้อมูลออเดอร์สำเร็จ' : 'ยังไม่มีออเดอร์'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/kitchen - ครัวดูออเดอร์ทั้งหมด
const getKitchenOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllActiveOrders();
    res.json({ success: true, data: orders, message: 'ดึงข้อมูลครัวสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/items/:id/status - ครัวอัปเดตสถานะอาหาร
const updateItemStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุสถานะใหม่'
      });
    }

    const result = await orderService.updateItemStatus(parseInt(id), status);
    res.json({
      success: true,
      data:    result,
      message: `อัปเดตสถานะเป็น ${status} แล้ว`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/request-bill - ลูกค้าขอเรียกเก็บเงิน
const requestBill = async (req, res) => {
  try {
    const tableId = req.user.tableId;
    await orderService.requestBill(tableId);
    res.json({
      success: true,
      message: 'เรียกพนักงานแล้ว! รอสักครู่นะคะ 🙏'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/close-table/:tableId - พนักงานเคลียร์โต๊ะ
const closeTable = async (req, res) => {
  try {
    const { tableId }       = req.params;
    const { paymentMethod } = req.body;

    if (!paymentMethod || !['CASHIER', 'PROMPTPAY'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุวิธีชำระเงิน (CASHIER หรือ PROMPTPAY)'
      });
    }

    await orderService.closeTable(parseInt(tableId), paymentMethod);
    res.json({
      success: true,
      message: 'เคลียร์โต๊ะสำเร็จ ขอบคุณที่ใช้บริการ 🌿'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/bill/:tableId - ดูบิลของโต๊ะ (Cashier)
const getBill = async (req, res) => {
  try {
    const bill = await orderService.getBillByTable(parseInt(req.params.tableId));
    if (!bill) {
      return res.status(404).json({ success: false, message: 'ไม่พบบิลของโต๊ะนี้' });
    }
    res.json({ success: true, data: bill, message: 'ดึงบิลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/tables-overview - ดูภาพรวมทุกโต๊ะ
const getTablesOverview = async (req, res) => {
  try {
    const tables = await orderService.getAllTablesWithOrders();
    res.json({ success: true, data: tables, message: 'ดึงข้อมูลโต๊ะสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrder,
  getKitchenOrders,
  updateItemStatus,
  requestBill,
  closeTable,
  getBill,
  getTablesOverview
};
