const bcrypt = require("bcryptjs");
const pool = require("./config/db");
const {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
  ADMIN_ROLE,
  NODE_ENV,
} = require("./config/appConfig");

async function createAdmin() {
  const email = ADMIN_EMAIL;
  const password = ADMIN_PASSWORD;
  const name = ADMIN_NAME || "Admin";
  const role = ADMIN_ROLE || "admin";

  if (!email || !password || (NODE_ENV === "production" && password === "Admin@123")) {
    console.error(
      "Please set a unique ADMIN_EMAIL and strong ADMIN_PASSWORD in your .env file.",
    );
    process.exit(1);
  }

  try {
    const [rows] = await pool.query("SELECT id FROM admins WHERE email = ?", [
      email,
    ]);
    if (rows.length) {
      console.log(`Admin already exists with email: ${email}`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );

    console.log(`Admin user created successfully. Email: ${email}`);
    if (NODE_ENV !== "production") {
      console.log("Use the configured ADMIN_PASSWORD to sign in.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
