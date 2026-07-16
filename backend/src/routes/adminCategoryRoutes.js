const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} = require("../controllers/adminCategoryController");

const router = express.Router();
router.use(protect);
router.use(adminOnly);

router.get("/", getAdminCategories);
router.post("/", createAdminCategory);
router.put("/:id", updateAdminCategory);
router.delete("/:id", deleteAdminCategory);

module.exports = router;
