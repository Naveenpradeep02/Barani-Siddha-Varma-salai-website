const express = require("express");
const { body } = require("express-validator");
const { loginAdmin } = require("../controllers/authController");
const loginRateLimiter = require("../middleware/loginRateLimiter");
const router = express.Router();

router.post(
  "/login",
  loginRateLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password is required"),
  ],
  loginAdmin,
);

module.exports = router;
