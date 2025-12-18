const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String, // We'll store image URL for now
    },
    type: {
      type: String,
      enum: ["veg", "non-veg"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);
