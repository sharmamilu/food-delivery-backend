const express = require("express");
const { getUserTransactions } = require("../controllers/transactionController");

const router = express.Router();

// GET all transactions for a specific user
router.get("/:userId", getUserTransactions);

module.exports = router;
