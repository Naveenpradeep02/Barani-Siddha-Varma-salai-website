const express = require("express");
const { createOrder } = require("../controllers/checkoutController");
const router = express.Router();

router.post("/", createOrder);

module.exports = router;
