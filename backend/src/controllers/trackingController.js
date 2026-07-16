const pool = require("../config/db");

async function trackOrder(req, res, next) {
  try {
    const { orderId, phone } = req.query;
    if (!orderId || !phone) {
      res.status(400);
      return next(new Error("Order ID and phone are required"));
    }

    const [orders] = await pool.query(
      "SELECT o.id, o.order_number, o.status AS order_status, o.payment_status, s.awb_code, s.courier_name, s.expected_delivery_date FROM orders o LEFT JOIN shipments s ON o.id = s.order_id WHERE o.order_number = ? AND o.customer_phone = ?",
      [orderId, phone],
    );

    if (!orders.length) {
      res.status(404);
      return next(new Error("Order not found"));
    }

    const order = orders[0];
    const [tracking] = await pool.query(
      "SELECT status, location, message, updated_at FROM tracking WHERE shipment_id = (SELECT id FROM shipments WHERE order_id = ?) ORDER BY updated_at DESC",
      [order.id],
    );

    res.json({ order, tracking });
  } catch (error) {
    next(error);
  }
}

module.exports = { trackOrder };
