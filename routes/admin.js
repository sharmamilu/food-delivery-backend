const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");

// Example protected route
router.get("/dashboard", adminMiddleware, (req, res) => {
  res.json({ message: "Welcome Admin Dashboard" });
});

module.exports = router;
