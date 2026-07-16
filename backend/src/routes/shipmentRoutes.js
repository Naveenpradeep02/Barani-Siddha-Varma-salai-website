const express = require("express");
const {
  createShipment,
  getTrackingStatus,
} = require("../controllers/shipmentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.post("/", createShipment);
router.get("/:shipmentId", getTrackingStatus);

module.exports = router;
