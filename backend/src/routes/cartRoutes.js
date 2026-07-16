const express = require("express");
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} = require("../controllers/cartController");
const router = express.Router();

router.get("/", getCart);
router.post("/", addCartItem);
router.patch("/:id", updateCartItem);
router.delete("/:id", removeCartItem);

module.exports = router;
