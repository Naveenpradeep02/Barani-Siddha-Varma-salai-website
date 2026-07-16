const pool = require("../config/db");
const { ensureGuestCustomer } = require("../utils/guestCustomer");

async function getCart(req, res, next) {
  try {
    const customerId = req.query.customerId || 1;
    const [cartItems] = await pool.query(
      `SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.discount_price, pi.url as image_url
       FROM cart c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_featured = 1
       WHERE c.customer_id = ?`,
      [customerId],
    );
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const normalizedItems = cartItems.map((item) => ({
      ...item,
      image_url: item.image_url ? `${baseUrl}/${item.image_url}` : null,
    }));
    res.json({ items: normalizedItems });
  } catch (error) {
    next(error);
  }
}

async function addCartItem(req, res, next) {
  try {
    const customerId = req.body.customerId || 1;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      res.status(400);
      return next(new Error("Product ID and quantity are required"));
    }

    await ensureGuestCustomer(customerId);

    await pool.query(
      `INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [customerId, productId, quantity],
    );
    res.status(201).json({ message: "Cart updated successfully" });
  } catch (error) {
    next(error);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await pool.query("UPDATE cart SET quantity = ? WHERE id = ?", [
      quantity,
      id,
    ]);
    res.json({ message: "Cart item updated successfully" });
  } catch (error) {
    next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM cart WHERE id = ?", [id]);
    res.json({ message: "Cart item removed successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem };
