// ===================================================
// 🌿 services/orderService.js - Business Logic ของออเดอร์
// ===================================================
//
// 📌 ความสัมพันธ์ Database ที่สำคัญ (One-to-Many):
//   orders (1) ←→ (Many) order_items
//   หนึ่ง "บิล" มีได้หลาย "รายการอาหาร"
//
// 📌 Flow การสั่งอาหาร:
//   1. ตรวจสอบว่าโต๊ะมี order ACTIVE อยู่ไหม
//   2. ถ้ายังไม่มี → สร้าง order ใหม่
//   3. บันทึก order_items (รายการอาหาร) เข้าไปใน order นั้น
//   4. คำนวณยอดรวมและอัปเดต orders.total_amount

const db = require('../config/db');

// ===================================================
// createOrder: ลูกค้าสั่งอาหาร
// ===================================================
// items = [{ menuItemId: 1, quantity: 2, notes: '' }, ...]
async function createOrder(tableId, items) {
  // เริ่ม Transaction: ทำหลาย query พร้อมกัน
  // ถ้า query ใดล้มเหลว → ยกเลิกทั้งหมด (Rollback)
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. หา order ACTIVE ของโต๊ะนี้
    //    ถ้ายังไม่มี → สร้างใหม่
    let [orders] = await conn.query(
      "SELECT id FROM orders WHERE table_id = ? AND status = 'ACTIVE'",
      [tableId]
    );

    let orderId;
    if (orders.length === 0) {
      // ไม่มี order เดิม → สร้างใหม่
      const [result] = await conn.query(
        "INSERT INTO orders (table_id, status) VALUES (?, 'ACTIVE')",
        [tableId]
      );
      orderId = result.insertId;
    } else {
      // มี order เดิมอยู่ → เพิ่มรายการเข้าไป
      orderId = orders[0].id;
    }

    // 2. บันทึก order_items ทีละรายการ
    //    บันทึก price และ item_name ณ เวลาสั่ง (Snapshot)
    //    เหตุผล: ถ้าราคาเปลี่ยนในอนาคต ยอดบิลต้องไม่เปลี่ยน
    let totalAdded = 0;
    for (const item of items) {
      // ดึงข้อมูลเมนูจาก DB เพื่อยืนยันราคา
      const [menuRows] = await conn.query(
        'SELECT name, price FROM menu_items WHERE id = ? AND is_available = TRUE',
        [item.menuItemId]
      );

      if (menuRows.length === 0) {
        throw new Error(`เมนู ID ${item.menuItemId} ไม่พบในระบบ`);
      }

      const menu = menuRows[0];
      const itemTotal = menu.price * item.quantity;
      totalAdded += itemTotal;

      // INSERT ลง order_items
      await conn.query(
        `INSERT INTO order_items
           (order_id, menu_item_id, quantity, price, item_name, status, notes)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [orderId, item.menuItemId, item.quantity, menu.price, menu.name, item.notes || null]
      );
    }

    // 3. อัปเดตยอดรวมใน orders
    await conn.query(
      'UPDATE orders SET total_amount = total_amount + ? WHERE id = ?',
      [totalAdded, orderId]
    );

    await conn.commit(); // ✅ บันทึกทุกอย่างถาวร

    return { orderId, totalAdded };
  } catch (err) {
    await conn.rollback(); // ❌ ยกเลิกถ้าเกิด error
    throw err;
  } finally {
    conn.release(); // คืน connection กลับ pool เสมอ
  }
}

// ===================================================
// getOrderByTable: ดูออเดอร์และสถานะของโต๊ะ
// ===================================================
async function getOrderByTable(tableId) {
  // JOIN 3 ตาราง: orders + order_items + menu_items
  const [items] = await db.query(
    `SELECT
       o.id         AS order_id,
       o.status     AS order_status,
       o.total_amount,
       o.created_at AS order_time,
       oi.id        AS item_id,
       oi.item_name,
       oi.quantity,
       oi.price,
       oi.status    AS item_status,
       oi.notes,
       oi.created_at AS item_time,
       m.image_url
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN menu_items  m  ON oi.menu_item_id = m.id
     WHERE o.table_id = ? AND o.status IN ('ACTIVE','BILL_REQUESTED')
     ORDER BY oi.created_at DESC`,
    [tableId]
  );

  if (items.length === 0) return null;

  // จัดกลุ่มข้อมูล (Group รายการอาหารเข้า order)
  return {
    orderId:      items[0].order_id,
    orderStatus:  items[0].order_status,
    totalAmount:  items[0].total_amount,
    orderTime:    items[0].order_time,
    items:        items.map(i => ({
      id:         i.item_id,
      name:       i.item_name,
      quantity:   i.quantity,
      price:      i.price,
      status:     i.item_status,
      notes:      i.notes,
      time:       i.item_time,
      imageUrl:   i.image_url
    }))
  };
}

// ===================================================
// getAllActiveOrders: ดูออเดอร์ทั้งหมด (สำหรับครัว)
// ===================================================
async function getAllActiveOrders() {
  const [rows] = await db.query(
    `SELECT
       o.id         AS order_id,
       o.status     AS order_status,
       o.created_at AS order_time,
       t.table_number,
       oi.id        AS item_id,
       oi.item_name,
       oi.quantity,
       oi.price,
       oi.status    AS item_status,
       oi.notes,
       oi.created_at AS item_time
     FROM orders o
     JOIN tables     t  ON o.table_id = t.id
     JOIN order_items oi ON o.id = oi.order_id
     WHERE o.status IN ('ACTIVE','BILL_REQUESTED')
       AND oi.status != 'SERVED'
     ORDER BY oi.created_at ASC`
  );

  if (rows.length === 0) return [];

  // จัดกลุ่มตามโต๊ะ
  const grouped = {};
  for (const row of rows) {
    const key = row.order_id;
    if (!grouped[key]) {
      grouped[key] = {
        orderId:     row.order_id,
        orderStatus: row.order_status,
        tableNumber: row.table_number,
        orderTime:   row.order_time,
        items:       []
      };
    }
    grouped[key].items.push({
      id:       row.item_id,
      name:     row.item_name,
      quantity: row.quantity,
      price:    row.price,
      status:   row.item_status,
      notes:    row.notes,
      time:     row.item_time
    });
  }

  return Object.values(grouped);
}

// ===================================================
// updateItemStatus: อัปเดตสถานะอาหารในครัว
// ===================================================
// PENDING → COOKING → SERVED
async function updateItemStatus(itemId, newStatus) {
  const validStatuses = ['PENDING', 'COOKING', 'SERVED'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('สถานะไม่ถูกต้อง');
  }

  const [result] = await db.query(
    'UPDATE order_items SET status = ? WHERE id = ?',
    [newStatus, itemId]
  );

  if (result.affectedRows === 0) {
    throw new Error('ไม่พบรายการอาหารนี้');
  }

  return { itemId, newStatus };
}

// ===================================================
// requestBill: ลูกค้าขอเรียกเก็บเงิน
// ===================================================
async function requestBill(tableId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // อัปเดต orders status
    await conn.query(
      "UPDATE orders SET status = 'BILL_REQUESTED' WHERE table_id = ? AND status = 'ACTIVE'",
      [tableId]
    );

    // อัปเดต table status
    await conn.query(
      "UPDATE tables SET status = 'BILL_REQUESTED' WHERE id = ?",
      [tableId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ===================================================
// closeTable: พนักงานเคลียร์โต๊ะหลังชำระเงิน
// ===================================================
async function closeTable(tableId, paymentMethod) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // อัปเดต order เป็น PAID
    await conn.query(
      "UPDATE orders SET status = 'PAID', payment_method = ? WHERE table_id = ? AND status = 'BILL_REQUESTED'",
      [paymentMethod, tableId]
    );

    // รีเซ็ตสถานะโต๊ะเป็น AVAILABLE
    await conn.query(
      "UPDATE tables SET status = 'AVAILABLE' WHERE id = ?",
      [tableId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ===================================================
// getBillByTable: ดูบิลรวมของโต๊ะ (สำหรับแคชเชียร์)
// ===================================================
async function getBillByTable(tableId) {
  const [rows] = await db.query(
    `SELECT
       o.id AS order_id,
       o.status,
       o.total_amount,
       o.created_at,
       t.table_number,
       oi.item_name,
       oi.quantity,
       oi.price,
       (oi.quantity * oi.price) AS subtotal
     FROM orders o
     JOIN tables     t  ON o.table_id = t.id
     JOIN order_items oi ON o.id = oi.order_id
     WHERE o.table_id = ? AND o.status IN ('ACTIVE','BILL_REQUESTED')
     ORDER BY oi.created_at`,
    [tableId]
  );

  if (rows.length === 0) return null;

  return {
    orderId:     rows[0].order_id,
    status:      rows[0].status,
    totalAmount: rows[0].total_amount,
    tableNumber: rows[0].table_number,
    createdAt:   rows[0].created_at,
    items:       rows.map(r => ({
      name:     r.item_name,
      quantity: r.quantity,
      price:    r.price,
      subtotal: r.subtotal
    }))
  };
}

// ดูออเดอร์ทั้งหมดทุกโต๊ะ (สำหรับ cashier dashboard)
async function getAllTablesWithOrders() {
  const [rows] = await db.query(
    `SELECT
       t.id,
       t.table_number,
       t.status,
       o.id AS order_id,
       o.total_amount,
       o.created_at AS order_time,
       COUNT(oi.id) AS item_count
     FROM tables t
     LEFT JOIN orders o ON t.id = o.table_id AND o.status IN ('ACTIVE','BILL_REQUESTED')
     LEFT JOIN order_items oi ON o.id = oi.order_id
     GROUP BY t.id, t.table_number, t.status, o.id, o.total_amount, o.created_at
     ORDER BY t.table_number`
  );
  return rows;
}

module.exports = {
  createOrder,
  getOrderByTable,
  getAllActiveOrders,
  updateItemStatus,
  requestBill,
  closeTable,
  getBillByTable,
  getAllTablesWithOrders
};
