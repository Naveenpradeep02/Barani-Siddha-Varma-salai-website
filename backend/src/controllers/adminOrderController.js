const pool = require("../config/db");

async function getAdminOrders(req, res, next) {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.tax_amount, o.shipping_charges,
              o.discount_amount, o.grand_total, o.status, o.payment_status, o.created_at,
              o.shipping_address, o.billing_address, o.customer_email as order_customer_email,
              o.customer_phone as order_customer_phone,
              c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              s.awb_code, s.courier_name, s.status as shipment_status, s.expected_delivery_date
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN shipments s ON o.id = s.order_id
       ORDER BY o.created_at DESC
       LIMIT 200`,
    );

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

async function getAdminOrderTracking(req, res, next) {
  try {
    const { orderId } = req.params;
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.tax_amount, o.shipping_charges,
              o.discount_amount, o.grand_total, o.status, o.payment_status, o.created_at,
              c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              o.shipping_address, o.billing_address, o.customer_phone, o.customer_email,
              s.awb_code, s.courier_name, s.status as shipment_status, s.expected_delivery_date
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN shipments s ON o.id = s.order_id
       WHERE o.id = ?`,
      [orderId],
    );

    if (!orders.length) {
      res.status(404);
      return next(new Error("Order not found"));
    }

    const order = orders[0];
    const [items] = await pool.query(
      `SELECT oi.id, oi.quantity, oi.unit_price, oi.discount_price, oi.total_price,
              p.id as product_id, p.name as product_name, p.sku,
              COALESCE(pi.url, '') as image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_featured = TRUE
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderId],
    );
    const [tracking] = await pool.query(
      "SELECT status, location, message, updated_at FROM tracking WHERE shipment_id = (SELECT id FROM shipments WHERE order_id = ?) ORDER BY updated_at DESC",
      [orderId],
    );

    res.json({ order, items, tracking });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAdminOrders, getAdminOrderTracking };
