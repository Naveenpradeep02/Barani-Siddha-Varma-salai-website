const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
} = require("../config/appConfig");

async function loginAdmin(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(
      new Error(
        errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      ),
    );
  }

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [
      email,
    ]);

    if (!rows.length) {
      res.status(401);
      return next(new Error("Invalid credentials"));
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error("Invalid credentials"));
    }

    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, {
      audience: "admin",
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      subject: String(admin.id),
    });

    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { loginAdmin };
