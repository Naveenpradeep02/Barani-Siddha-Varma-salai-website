const express = require("express");
const {
  getAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
} = require("../controllers/adminBrandController");

const router = express.Router();

router.get("/", getAdminBrands);
router.post("/", createAdminBrand);
router.put("/:id", updateAdminBrand);
router.delete("/:id", deleteAdminBrand);

module.exports = router;
