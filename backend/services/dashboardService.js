const db = require('../config/db');

function dateFilter(range, alias = 'o') {
  switch (range) {
    case 'today': return `AND DATE(${alias}.created_at) = CURDATE()`;
    case '7d':    return `AND ${alias}.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    case '30d':   return `AND ${alias}.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    default:      return '';
  }
}

async function getDashboardData(range = 'today') {
  const df = dateFilter(range);

  const [[summary]] = await db.query(`
    SELECT
      COALESCE(SUM(total_amount), 0) AS total_revenue,
      COUNT(*)                        AS order_count,
      COALESCE(AVG(total_amount), 0)  AS avg_bill
    FROM orders o
    WHERE status = 'PAID' ${df}
  `);

  const [[activeRow]] = await db.query(`
    SELECT COUNT(*) AS active_now FROM orders WHERE status IN ('ACTIVE','BILL_REQUESTED')
  `);

  const [byPayment] = await db.query(`
    SELECT
      payment_method  AS method,
      COUNT(*)        AS count,
      SUM(total_amount) AS total
    FROM orders o
    WHERE status = 'PAID' ${df}
    GROUP BY payment_method
  `);

  const [topItems] = await db.query(`
    SELECT
      oi.item_name         AS name,
      SUM(oi.quantity)     AS qty,
      SUM(oi.quantity * oi.price) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'PAID' ${df}
    GROUP BY oi.item_name
    ORDER BY qty DESC
    LIMIT 10
  `);

  const [byCategory] = await db.query(`
    SELECT
      c.name  AS category,
      c.icon,
      SUM(oi.quantity)           AS qty,
      SUM(oi.quantity * oi.price) AS revenue
    FROM order_items oi
    JOIN orders     o ON oi.order_id    = o.id
    JOIN menu_items m ON oi.menu_item_id = m.id
    JOIN categories c ON m.category_id  = c.id
    WHERE o.status = 'PAID' ${df}
    GROUP BY c.id, c.name, c.icon
    ORDER BY revenue DESC
  `);

  const trendDays = range === '30d' ? 30 : 7;
  const [daily] = await db.query(`
    SELECT
      DATE(o.created_at)  AS date,
      SUM(o.total_amount) AS revenue,
      COUNT(*)            AS orders
    FROM orders o
    WHERE o.status = 'PAID'
      AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ${trendDays} DAY)
    GROUP BY DATE(o.created_at)
    ORDER BY date ASC
  `);

  return {
    summary: {
      totalRevenue: Number(summary.total_revenue),
      orderCount:   Number(summary.order_count),
      avgBill:      Number(summary.avg_bill),
      activeNow:    Number(activeRow.active_now)
    },
    byPayment,
    topItems,
    byCategory,
    daily
  };
}

module.exports = { getDashboardData };
