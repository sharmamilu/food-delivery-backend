const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true
  },
  planType: {
    type: String,
    enum: ['monthly', 'weekly', 'custom', 'special'],
    required: true
  },
  noOfPersons: {
    type: Number,
    required: true,
    default: 1
  },
  duration: {
    type: String,
    required: true // e.g., "30 days", "7 days", "Custom"
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: false
  },
  savingsPercentage: {
    type: Number,
    default: 0
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  colorCode: {
    type: String,
    default: "#667eea"
  },
  gradientColors: {
    type: [String],
    default: ["#667eea", "#764ba2"]
  },
  features: [{
    type: String,
    required: true
  }],
  details: [{
    type: String,
    required: true
  }],
  includes: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    freeDelivery: { type: Boolean, default: false },
    nutritionTracking: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customizableMenu: { type: Boolean, default: false },
    weeklyMenuRefresh: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
subscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);