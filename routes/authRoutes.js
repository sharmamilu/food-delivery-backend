const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

router.post("/register", registerUser);
router.post("/login", loginUser);
const crypto = require("crypto");

// Step 1: Request Reset (sends OTP or link)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  console.log("the user is", user);

  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = crypto.randomBytes(4).toString("hex"); // e.g. "9f3b2a4c"
  user.resetToken = resetToken;
  user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  // You can send email/SMS here (for now we’ll just log)
  console.log(`Reset token for ${email}: ${resetToken}`);

  res.json({
    message: "Reset token generated. Check console/logs.",
    token: resetToken,
  });
});

router.post("/request-otp", async (req, res) => {
  const { contact } = req.body; // can be phone or email
  if (!contact)
    return res.status(400).json({ message: "Phone or email required" });

  const user = await User.findOne({
    $or: [{ email: contact }, { phone: contact }],
  });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // For now, just log OTP
  console.log(`OTP for ${contact}: ${otp}`);

  res.json({ message: "OTP sent successfully (check console for now)" });
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const { contact, otp, newPassword } = req.body;
  const user = await User.findOne({
    $or: [{ email: contact }, { phone: contact }],
    otp,
    otpExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  res.json({ message: "Password reset successful!" });
});

// Step 2: Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetToken: token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ message: "Password reset successfully" });
});

// 🔒 Protected route (for testing)
router.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "Welcome to your profile", userId: req.user.id });
});

router.get("/verify-token", authMiddleware, (req, res) => {
  res.json({ valid: true, userId: req.user.id });
});
module.exports = router;
