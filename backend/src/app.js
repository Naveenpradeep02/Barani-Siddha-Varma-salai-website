const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const { CORS_ORIGIN, NODE_ENV } = require("./config/appConfig");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();
const isProduction = NODE_ENV === "production";
const defaultDevOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const defaultProductionOrigins = ["https://bnaranisiddha.netlify.app"];
const allowedOrigins = Array.from(
  new Set(
    CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .concat(defaultDevOrigins, defaultProductionOrigins),
  ),
);

if (isProduction) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!isProduction || !origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error(`Origin ${origin} is not allowed by CORS`);
      error.statusCode = 403;
      return callback(error);
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
