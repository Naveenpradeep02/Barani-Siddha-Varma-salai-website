const express = require("express");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const customerRoutes = require("./customerRoutes");
const cartRoutes = require("./cartRoutes");
const checkoutRoutes = require("./checkoutRoutes");
const paymentRoutes = require("./paymentRoutes");
const shipmentRoutes = require("./shipmentRoutes");
const trackingRoutes = require("./trackingRoutes");
const categoryRoutes = require("./categoryRoutes");
const brandRoutes = require("./brandRoutes");
const adminProductRoutes = require("./adminProductRoutes");
const adminOrderRoutes = require("./adminOrderRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/payments", paymentRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/tracking", trackingRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/products", adminProductRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

module.exports = router;
