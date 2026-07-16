const pool = require("./config/db");
const { ensureConfiguredAdmin } = require("./utils/adminAccount");

async function seedAdmin() {
  try {
    await ensureConfiguredAdmin();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
