const express = require("express");
const {
  createPaymentRequest,
  getPaymentConfig,
  verifyPayment,
} = require("../controllers/paymentController");
const router = express.Router();

router.get("/config", getPaymentConfig);
router.post("/create", createPaymentRequest);
router.get("/verify", verifyPayment);

module.exports = router;
