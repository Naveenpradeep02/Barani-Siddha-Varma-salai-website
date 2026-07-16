const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_ISSUER } = require("../config/appConfig");
const pool = require("../config/db");

async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error("Not authorized, token missing"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      audience: "admin",
      issuer: JWT_ISSUER,
    });
    const [rows] = await pool.query(
      "SELECT id, email, role, name FROM admins WHERE id = ?",
      [decoded.id],
    );

    if (!rows.length) {
      res.status(401);
      return next(new Error("Not authorized, user not found"));
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401);
    next(new Error("Not authorized, token failed"));
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    next(new Error("Require admin role"));
  }
}

module.exports = { protect, adminOnly };
