const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail, emailTemplates } = require("../config/emailConfig"); // Import email functions

router.post("/register", registerUser);
router.post("/login", loginUser);

// Request OTP
router.post("/request-otp", async (req, res) => {
  const { contact } = req.body;
  if (!contact)
    return res.status(400).json({ message: "Email required" });

  // Find by email
  const user = await User.findOne({ email: contact });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save();

  console.log(`OTP for ${contact}: ${otp}`);

  // Send OTP via email
  try {
    const emailTemplate = emailTemplates.otpEmail(otp, user.name);
    const emailResult = await sendEmail(
      user.email,
      emailTemplate.subject,
      emailTemplate.html
    );

    if (emailResult.success) {
      console.log(`OTP email sent successfully to ${user.email}`);
      res.json({ 
        message: "OTP sent successfully to your email",
        emailSent: true 
      });
    } else {
      console.warn(`Failed to send email, but OTP generated: ${otp}`);
      res.json({ 
        message: "OTP generated but email failed. Check console for OTP.",
        emailSent: false,
        otp: otp // Only include in development/testing
      });
    }
  } catch (emailError) {
    console.error("Email sending error:", emailError);
    res.json({ 
      message: "OTP generated but email failed. Check console for OTP.",
      emailSent: false,
      otp: otp // Only include in development/testing
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { contact, otp } = req.body;
  
  console.log("=== VERIFY OTP ===");
  console.log("Contact:", contact);
  console.log("OTP:", otp);
  
  // Find by email
  const user = await User.findOne({
    email: contact,
    otp,
    otpExpire: { $gt: Date.now() },
  });

  console.log("User found:", user ? user.email : "No user found");
  
  if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

  // Generate a temporary verification token
  const tempToken = crypto.randomBytes(32).toString("hex");
  console.log("Generated tempToken:", tempToken);
  
  user.tempToken = tempToken;
  user.tempTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  user.otp = undefined;
  user.otpExpire = undefined;
  
  await user.save();
  console.log("User saved with tempToken:", user.tempToken);

  res.json({ 
    message: "OTP verified successfully", 
    tempToken: tempToken,
    email: user.email 
  });
});

// Reset Password after OTP verification
router.post("/reset-password", async (req, res) => {
  console.log("=== RESET PASSWORD ===");
  console.log("Request body:", req.body);
  
  const { contact, tempToken, newPassword, confirmPassword } = req.body;

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  console.log("Searching for user with:");
  console.log("Email:", contact);
  console.log("tempToken:", tempToken);
  
  // Find by email and check tempToken
  const user = await User.findOne({
    email: contact,
    tempToken: tempToken,
    tempTokenExpire: { $gt: Date.now() },
  });

  console.log("User found:", user ? user.email : "No user found");
  
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification" });
  }

  // Hash and save new password
  user.password = await bcrypt.hash(newPassword, 10);
  user.tempToken = undefined;
  user.tempTokenExpire = undefined;
  await user.save();

  // Send password reset success email
  try {
    const emailTemplate = emailTemplates.passwordResetSuccess(user.name);
    await sendEmail(
      user.email,
      emailTemplate.subject,
      emailTemplate.html
    );
    console.log(`Password reset success email sent to ${user.email}`);
  } catch (emailError) {
    console.error("Failed to send password reset success email:", emailError);
    // Don't fail the request if email fails
  }

  res.json({ 
    message: "Password reset successfully",
    emailSent: true 
  });
});

// Debug endpoint to check user data
router.get("/debug-user/:email", async (req, res) => {
  const { email } = req.params;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  res.json({
    email: user.email,
    hasOtp: !!user.otp,
    otp: user.otp,
    otpExpire: user.otpExpire,
    hasTempToken: !!user.tempToken,
    tempToken: user.tempToken,
    tempTokenExpire: user.tempTokenExpire,
    currentTime: Date.now(),
    otpValid: user.otpExpire ? Date.now() < user.otpExpire : false,
    tempTokenValid: user.tempTokenExpire ? Date.now() < user.tempTokenExpire : false,
  });
});

// Test email endpoint (for development)
router.post("/test-email", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const testTemplate = emailTemplates.otpEmail("123456", "Test User");
    const result = await sendEmail(
      email,
      "Test Email - Password Reset",
      testTemplate.html
    );

    if (result.success) {
      res.json({ 
        message: "Test email sent successfully",
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        message: "Failed to send test email",
        error: result.error 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error sending test email",
      error: error.message 
    });
  }
});

// Protected routes
router.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "Welcome to your profile", userId: req.user.id });
});

router.get("/verify-token", authMiddleware, (req, res) => {
  res.json({ valid: true, userId: req.user.id });
});

module.exports = router;