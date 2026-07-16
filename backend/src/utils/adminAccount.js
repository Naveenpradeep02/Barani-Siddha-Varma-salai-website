const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const {
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_PASSWORD,
  ADMIN_RESET_PASSWORD,
  ADMIN_ROLE,
  NODE_ENV,
} = require("../config/appConfig");

async function ensureConfiguredAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn(
      "ADMIN_EMAIL and ADMIN_PASSWORD are not set. Skipping admin account setup.",
    );
    return;
  }

  if (NODE_ENV === "production" && ADMIN_PASSWORD === "Admin@123") {
    throw new Error("ADMIN_PASSWORD must be unique and strong in production.");
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const name = ADMIN_NAME || "Admin";
  const role = ADMIN_ROLE || "admin";

  const [rows] = await pool.query("SELECT id FROM admins WHERE email = ?", [
    email,
  ]);

  if (rows.length && !ADMIN_RESET_PASSWORD) {
    console.log(`Admin account ready: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (rows.length) {
    await pool.query(
      "UPDATE admins SET name = ?, password = ?, role = ? WHERE email = ?",
      [name, hashedPassword, role, email],
    );
    console.log(`Admin password reset for: ${email}`);
    return;
  }

  await pool.query(
    "INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role],
  );
  console.log(`Admin account created: ${email}`);
}

module.exports = { ensureConfiguredAdmin };
