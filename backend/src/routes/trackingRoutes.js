const express = require("express");
const { trackOrder } = require("../controllers/trackingController");
const router = express.Router();

router.get("/", trackOrder);

module.exports = router;
