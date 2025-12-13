const express = require("express");
const router = express.Router();
const { addOrder, getOrders } = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
router.post("/add", authMiddleware, addOrder);
router.get("/:userId", authMiddleware, getOrders);

module.exports = router;
