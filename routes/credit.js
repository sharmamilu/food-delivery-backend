// routes/credit.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Add Top-up
// ✅ Updated Top-up
router.post("/topup", authMiddleware, async (req, res) => {
  try {
    const { amount, userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.credits += amount;
    user.transactions.push({
      type: "topup",
      amount,
      description: `Wallet top-up of ₹${amount}`,
    });

    await user.save();

    res.json({
      message: "Top-up successful",
      credits: user.credits,
      transactions: user.transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Top-up failed", error });
  }
});

// ✅ Updated Referral Bonus
router.post("/referral", authMiddleware, async (req, res) => {
  try {
    const { bonusAmount, userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    const amount = bonusAmount || 200;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.credits += amount;
    user.transactions.push({
      type: "referral",
      amount,
      description: `Referral bonus of ₹${amount}`,
    });

    await user.save();

    res.json({
      message: "Referral bonus added successfully",
      credits: user.credits,
      transactions: user.transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add referral bonus", error });
  }
});


// ✅ Get User Credits & Transactions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      credits: user.credits,
      transactions: user.transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch credits", error });
  }
});

router.post("/deduct", authMiddleware, async (req, res) => {
  try {
    const { amount, userId, description } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for sufficient balance
    if (user.credits < amount) {
      return res.status(400).json({ message: "Insufficient credits" });
    }

    // Deduct credits
    user.credits -= amount;
    user.transactions.push({
      type: "debit",
      amount,
      description: description || `Debit of ₹${amount}`,
    });

    await user.save();

    res.json({
      message: "Credits deducted successfully",
      remainingCredits: user.credits,
      lastTransaction: {
        type: "debit",
        amount,
        description: description || `Debit of ₹${amount}`,
      },
      transactions: user.transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to deduct credits", error });
  }
});


module.exports = router;
