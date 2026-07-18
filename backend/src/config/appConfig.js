const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

if (NODE_ENV === "production" && (!process.env.JWT_SECRET || JWT_SECRET === "secret")) {
  throw new Error("JWT_SECRET must be set to a strong unique value in production.");
}

module.exports = {
  NODE_ENV,
  PORT: process.env.PORT || 5000,
  MYSQL_HOST: process.env.MYSQL_HOST || "localhost",
  MYSQL_PORT: process.env.MYSQL_PORT || 3306,
  MYSQL_USER: process.env.MYSQL_USER || "root",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || "ecom_db",
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_ISSUER: process.env.JWT_ISSUER || "dgrow-ecom",
  CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  BACKEND_URL:
    process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
  CASHFREE_CLIENT_ID: process.env.CASHFREE_CLIENT_ID,
  CASHFREE_CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET,
  CASHFREE_ENDPOINT: process.env.CASHFREE_ENDPOINT,
  CASHFREE_API_VERSION: process.env.CASHFREE_API_VERSION || "2025-01-01",
  CASHFREE_ENV: process.env.CASHFREE_ENV || "sandbox",
  SHIPROCKET_API_URL: process.env.SHIPROCKET_API_URL,
  SHIPROCKET_API_EMAIL: process.env.SHIPROCKET_API_EMAIL,
  SHIPROCKET_API_PASSWORD: process.env.SHIPROCKET_API_PASSWORD,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_NAME: process.env.ADMIN_NAME,
  ADMIN_ROLE: process.env.ADMIN_ROLE || "admin",
  ADMIN_RESET_PASSWORD: process.env.ADMIN_RESET_PASSWORD === "true",
};
