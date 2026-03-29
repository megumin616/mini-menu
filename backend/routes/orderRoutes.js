// ===================================================
// 🌿 routes/orderRoutes.js
// ===================================================
const express          = require('express');
const router           = express.Router();
const orderController  = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middlewares/auth');

// ทุก route ต้องมี Token ก่อน
router.use(verifyToken);

// ---- ฝั่งลูกค้า (TABLE) ----
// POST /api/orders             → สั่งอาหาร
router.post('/', checkRole(['TABLE']), orderController.createOrder);

// GET  /api/orders/my-order   → ดูออเดอร์ตัวเอง
router.get('/my-order', checkRole(['TABLE']), orderController.getMyOrder);

// POST /api/orders/request-bill → เรียกเก็บเงิน
router.post('/request-bill', checkRole(['TABLE']), orderController.requestBill);

// ---- ฝั่งพนักงาน (STAFF/ADMIN) ----
// GET  /api/orders/kitchen     → ดูออเดอร์ในครัว
router.get('/kitchen', checkRole(['STAFF','ADMIN']), orderController.getKitchenOrders);

// GET  /api/orders/tables-overview → ดูภาพรวมทุกโต๊ะ
router.get('/tables-overview', checkRole(['STAFF','ADMIN']), orderController.getTablesOverview);

// GET  /api/orders/bill/:tableId → ดูบิลของโต๊ะ
router.get('/bill/:tableId', checkRole(['STAFF','ADMIN']), orderController.getBill);

// PATCH /api/orders/items/:id/status → อัปเดตสถานะในครัว
router.patch('/items/:id/status', checkRole(['STAFF','ADMIN']), orderController.updateItemStatus);

// POST /api/orders/close-table/:tableId → เคลียร์โต๊ะ
router.post('/close-table/:tableId', checkRole(['STAFF','ADMIN']), orderController.closeTable);

module.exports = router;
