// routes/subscription.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Subscription = require("../models/Subscription");
const User = require("../models/User");

const router = express.Router();

// Middleware to verify JWT
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

// ✅ Add Subscription
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { planName, planType, durationInDays, price } = req.body;

    if (!planName || !durationInDays || !price)
      return res.status(400).json({ message: "Missing required fields" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationInDays);

    const subscription = new Subscription({
      userId: req.userId,
      planName,
      planType,
      price,
      startDate,
      endDate,
    });

    await subscription.save();

    // Optional: deduct from user's credits
    const user = await User.findById(req.userId);
    if (user) {
      user.credits -= price;
      user.transactions.push({
        type: "subscription",
        amount: -price,
        description: `Subscribed to ${planName}`,
      });
      await user.save();
    }

    res.json({
      message: "Subscription added successfully",
      subscription,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add subscription", error: error.message });
  }
});

// ✅ Get All User Subscriptions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId }).sort({
      startDate: -1,
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscriptions", error });
  }
});

// ✅ (Optional) Get Active Subscriptions Only
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const subscriptions = await Subscription.find({
      userId: req.userId,
      endDate: { $gte: today },
    });
    res.json(subscriptions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch active subscriptions", error });
  }
});

module.exports = router;
