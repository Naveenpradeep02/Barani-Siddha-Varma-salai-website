const express = require("express");
const { body } = require("express-validator");
const {
  registerCustomer,
  loginCustomer,
} = require("../controllers/customerController");
const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must have at least 6 characters"),
  ],
  registerCustomer,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginCustomer,
);

module.exports = router;
