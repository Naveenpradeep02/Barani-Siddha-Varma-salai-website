const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const { ensureCheckoutCustomer } = require("../utils/guestCustomer");

async function createOrder(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      customerId = 1,
      shippingAddress,
      billingAddress,
      customerName,
      customerPhone,
      customerEmail,
      items,
      taxAmount,
      shippingCharges,
      discountAmount,
      couponId,
    } = req.body;

    if (!items || !items.length) {
      res.status(400);
      return next(new Error("No order items provided"));
    }

    const checkoutCustomerId = await ensureCheckoutCustomer({
      customerId,
      customerName,
      customerEmail,
      customerPhone,
    });

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const grandTotal =
      subtotal +
      Number(taxAmount || 0) +
      Number(shippingCharges || 0) -
      Number(discountAmount || 0);
    const orderNumber = `DGROW-${uuidv4().split("-")[0].toUpperCase()}`;

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, customer_id, shipping_address, billing_address, customer_phone, customer_email, total_amount, tax_amount, shipping_charges, discount_amount, grand_total, payment_status, status, coupon_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`,
      [
        orderNumber,
        checkoutCustomerId,
        shippingAddress,
        billingAddress,
        customerPhone,
        customerEmail,
        subtotal,
        taxAmount || 0,
        shippingCharges || 0,
        discountAmount || 0,
        grandTotal,
        couponId || null,
      ],
    );

    const orderId = orderResult.insertId;
    const orderItems = items.map((item) => [
      orderId,
      item.productId,
      item.quantity,
      item.price,
      item.discountPrice || 0,
      item.price * item.quantity,
    ]);
    await connection.query(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_price, total_price) VALUES ?",
      [orderItems],
    );

    await Promise.all(
      items.map((item) =>
        connection.query(
          "UPDATE inventory SET quantity = quantity - ?, sold_quantity = sold_quantity + ? WHERE product_id = ?",
          [item.quantity, item.quantity, item.productId],
        ),
      ),
    );

    await connection.commit();

    res
      .status(201)
      .json({ orderId, orderNumber, grandTotal, paymentStatus: "pending" });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = { createOrder };
