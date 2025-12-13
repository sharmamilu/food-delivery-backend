const SubscriptionPlan = require('../models/SubscriptionPlan');

// Create new subscription plan
const createSubscriptionPlan = async (req, res) => {
  try {
    const {
      planId,
      title,
      subtitle,
      planType,
      noOfPersons,
      duration,
      price,
      originalPrice,
      savingsPercentage,
      isPopular,
      colorCode,
      gradientColors,
      features,
      details,
      includes
    } = req.body;

    // Check if plan with same ID already exists
    const existingPlan = await SubscriptionPlan.findOne({ planId });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID already exists'
      });
    }

    const newPlan = new SubscriptionPlan({
      planId,
      title,
      subtitle,
      planType,
      noOfPersons,
      duration,
      price,
      originalPrice,
      savingsPercentage: savingsPercentage || calculateSavings(price, originalPrice),
      isPopular: isPopular || false,
      colorCode: colorCode || "#667eea",
      gradientColors: gradientColors || ["#667eea", "#764ba2"],
      features: features || [],
      details: details || [],
      includes: includes || {}
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      plan: newPlan
    });
  } catch (error) {
    console.error('Create subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan',
      error: error.message
    });
  }
};

// Get all active subscription plans
const getAllSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
};

// Get subscription plan by ID
const getSubscriptionPlanById = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await SubscriptionPlan.findOne({ 
      planId,
      isActive: true 
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plan',
      error: error.message
    });
  }
};

// Update subscription plan
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    const plan = await SubscriptionPlan.findOneAndUpdate(
      { planId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan',
      error: error.message
    });
  }
};

// Delete/Deactivate subscription plan
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await SubscriptionPlan.findOneAndUpdate(
      { planId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription plan deactivated successfully'
    });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription plan',
      error: error.message
    });
  }
};

// Get plans by type
const getPlansByType = async (req, res) => {
  try {
    const { planType } = req.params;
    
    const plans = await SubscriptionPlan.find({
      planType,
      isActive: true
    }).sort({ price: 1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('Get plans by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans by type',
      error: error.message
    });
  }
};

// Helper function to calculate savings percentage
const calculateSavings = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return 0;
  const savings = ((originalPrice - price) / originalPrice) * 100;
  return Math.round(savings);
};

const getAllSubscriptionOrders = async (req, res) => {
  try {
    const orders = await SubscriptionOrder.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get all subscription orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription orders',
      error: error.message
    });
  }
};

module.exports = {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPlansByType,
  getAllSubscriptionOrders
};