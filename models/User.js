const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  contact: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  otp: String,
  otpExpire: Date,
  credits: { type: Number, default: 0 },
  transactions: [
    {
      type: {
        type: String,
        enum: ["topup", "referral", "subscription", "deduction"],
        default: "topup",
      },
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
