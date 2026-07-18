const app = require("./app");
const pool = require("./config/db");
const { PORT } = require("./config/appConfig");
const { ensureConfiguredAdmin } = require("./utils/adminAccount");

async function startServer() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("Database connected successfully.");
    await ensureConfiguredAdmin();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other backend process or set a different PORT in backend/.env.`,
      );
      process.exit(1);
    }

    console.error("Backend server failed:", error.message);
    process.exit(1);
  });
}

startServer();
