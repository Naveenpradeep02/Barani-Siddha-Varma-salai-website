const pool = require("../config/db");

async function getOrders(req, res, next) {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at,
              c.name as customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC
       LIMIT 100`,
    );

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

module.exports = { getOrders };
