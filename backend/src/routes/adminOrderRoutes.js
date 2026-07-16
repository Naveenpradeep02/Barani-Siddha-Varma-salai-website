const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAdminOrders,
  getAdminOrderTracking,
} = require("../controllers/adminOrderController");

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/", getAdminOrders);
router.get("/:orderId/tracking", getAdminOrderTracking);

module.exports = router;
