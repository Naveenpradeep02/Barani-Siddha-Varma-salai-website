const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
} = require("../controllers/adminProductController");
const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/", getAdminProducts);
router.post("/", upload.array("images", 10), createProduct);
router.put("/:id", upload.array("images", 10), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
