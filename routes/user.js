const express = require("express");
const { getAllUsers,getUser } = require("../controllers/userController");

const router = express.Router();

// GET all transactions for a specific user
router.get("/all-users", getAllUsers);
router.get("/:userId", getUser);

module.exports = router;
