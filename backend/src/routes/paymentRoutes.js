const express = require("express");
const {
  createPaymentRequest,
  verifyPayment,
} = require("../controllers/paymentController");
const router = express.Router();

router.post("/create", createPaymentRequest);
router.get("/verify", verifyPayment);

module.exports = router;
