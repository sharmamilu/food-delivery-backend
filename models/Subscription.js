const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subscription title is required'],
    trim: true,
  },
  subtitle: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
  },
  durationDays: {
    type: Number,
    required: [true, 'Duration in days is required'],
    min: [1, 'Duration must be at least 1 day'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100'],
  },
  type: {
    type: String,
    enum: ['monthly', 'weekly', 'custom', 'lunch', 'corporate', 'family'],
    required: [true, 'Subscription type is required'],
  },
  category: {
    type: String,
    enum: ['individual', 'family', 'corporate', 'student', 'premium'],
    required: [true, 'Category is required'],
  },
  mealsPerDay: {
    type: Number,
    min: [1, 'At least 1 meal per day required'],
    max: [5, 'Maximum 5 meals per day allowed'],
    default: 3,
  },
  features: [{
    title: String,
    description: String,
    icon: String,
  }],
  inclusions: [{
    type: String,
  }],
  popular: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  maxUsers: {
    type: Number,
    min: [1, 'Maximum users must be at least 1'],
  },
  color: {
    type: String,
    default: '#667eea',
  },
  gradient: [{
    type: String,
  }],
  imageUrl: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt timestamp before saving
subscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to calculate savings
subscriptionPlanSchema.methods.calculateSavings = function() {
  if (this.originalPrice && this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
};

// Virtual for formatted price
subscriptionPlanSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}`;
});

// Virtual for formatted original price
subscriptionPlanSchema.virtual('formattedOriginalPrice').get(function() {
  return this.originalPrice ? `₹${this.originalPrice}` : null;
});

// Virtual for savings text
subscriptionPlanSchema.virtual('savingsText').get(function() {
  const savings = this.calculateSavings();
  return savings > 0 ? `${savings}% OFF` : null;
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;