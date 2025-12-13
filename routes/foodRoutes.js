const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const adminauthMiddleware = require("../middleware/adminauthMiddleware");
// ✅ POST - Add new food item
router.post("/add", adminauthMiddleware, async (req, res) => {
  try {
    const { name, description, price, image } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required.",
      });
    }

    const newFood = new Food({
      name,
      description,
      price,
      image,
    });

    await newFood.save();

    res.json({
      success: true,
      message: "Food item added successfully",
      data: newFood,
    });
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({
      success: false,
      message: "Error adding food item",
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
