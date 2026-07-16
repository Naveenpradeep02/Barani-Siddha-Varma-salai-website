const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const pool = require("../config/db");
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
} = require("../config/appConfig");

function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, {
    audience: "customer",
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    subject: String(id),
  });
}

async function registerCustomer(req, res, next) {
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

  const { name, email, phone, password } = req.body;

  try {
    const [existing] = await pool.query(
      "SELECT id FROM customers WHERE email = ?",
      [email],
    );
    if (existing.length) {
      res.status(400);
      return next(new Error("Email already registered"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)",
      [name, email, phone, hashedPassword],
    );

    const token = generateToken(result.insertId);
    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, phone },
    });
  } catch (error) {
    next(error);
  }
}

async function loginCustomer(req, res, next) {
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
    const [rows] = await pool.query("SELECT * FROM customers WHERE email = ?", [
      email,
    ]);
    if (!rows.length) {
      res.status(401);
      return next(new Error("Invalid credentials"));
    }

    const customer = rows[0];
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error("Invalid credentials"));
    }

    const token = generateToken(customer.id);
    res.json({
      token,
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getCustomerProfile(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, created_at FROM customers WHERE id = ?",
      [req.customer.id],
    );
    res.json({ profile: rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = { registerCustomer, loginCustomer, getCustomerProfile };
