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

module.exports = { ensureGuestCustomer };
