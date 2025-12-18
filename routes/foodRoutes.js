const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const adminauthMiddleware = require("../middleware/adminauthMiddleware");
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");
// ✅ POST - Add new food item
router.post("/add", adminauthMiddleware, async (req, res) => {
  try {
    const { name, description, price, image,type } = req.body;

    // Validate required fields
    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    let cloudinaryUrl = null;

    // If image is provided as base64, upload to Cloudinary
    if (image && image.startsWith("data:image")) {
      try {
        const uploadResult = await uploadToCloudinary(image);
        cloudinaryUrl = uploadResult.url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to server",
        });
      }
    } else if (image) {
      // If it's already a URL (for backward compatibility)
      cloudinaryUrl = image;
    }

    // Create new food item
    const newFood = new Food({
      name,
      description,
      price: parseFloat(price),
      image: cloudinaryUrl,
      type: type, // You might want to add this as a field in your form
      category: "main", // You might want to add this as a field in your form
      isAvailable: true,
    });

    await newFood.save();

    res.status(201).json({
      success: true,
      message: "Food item added successfully",
      food: newFood,
    });
  } catch (error) {
    console.error("Add food error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add food item",
      error: error.message,
    });
  }
});

// ✅ GET - Fetch all food items
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 }); // latest first
    res.json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    console.error("Error fetching food items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching food items",
      error: error.message,
    });
  }
});

/// DELETE - Remove food item
router.delete("/:id", adminauthMiddleware, async (req, res) => {
  try {
    const deleted = await Food.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }
    res.json({ success: true, message: "Food item deleted successfully" });
  } catch (error) {
    console.error("Error deleting food item:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting food item" });
  }
});

// ✅ GET - Fetch single food item by ID
router.get("/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }
    res.json({
      success: true,
      data: food,
    });
  } catch (error) {
    console.error("Error fetching food item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching food item",
      error: error.message,
    });
  }
});

module.exports = router;
