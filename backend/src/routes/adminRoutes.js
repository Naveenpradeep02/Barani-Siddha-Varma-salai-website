const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getDashboard } = require("../controllers/adminController");
const adminCategoryRoutes = require("./adminCategoryRoutes");
const adminBrandRoutes = require("./adminBrandRoutes");
const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/dashboard", getDashboard);
router.use("/categories", adminCategoryRoutes);
router.use("/brands", adminBrandRoutes);

module.exports = router;
