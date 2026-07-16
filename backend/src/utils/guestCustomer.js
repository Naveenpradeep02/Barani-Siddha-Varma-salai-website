const pool = require("../config/db");

async function ensureGuestCustomer(customerId = 1) {
  await pool.query(
    `INSERT IGNORE INTO customers (id, name, email, phone, password)
     VALUES (?, ?, ?, ?, ?)`,
    [
      customerId,
      "Guest Customer",
      `guest-${customerId}@dgrow.local`,
      "0000000000",
      "guest-checkout",
    ],
  );
}

async function ensureCheckoutCustomer({
  customerId = 1,
  customerName,
  customerEmail,
  customerPhone,
}) {
  const name = String(customerName || "").trim() || "Guest Customer";
  const email = String(customerEmail || "").trim().toLowerCase();
  const phone = String(customerPhone || "").trim() || "0000000000";

  if (!email) {
    await ensureGuestCustomer(customerId);
    return customerId;
  }

  await pool.query(
    `INSERT INTO customers (name, email, phone, password)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone)`,
    [name, email, phone, "checkout-customer"],
  );

  const [customers] = await pool.query("SELECT id FROM customers WHERE email = ?", [
    email,
  ]);

  return customers[0].id;
}

module.exports = { ensureGuestCustomer, ensureCheckoutCustomer };
