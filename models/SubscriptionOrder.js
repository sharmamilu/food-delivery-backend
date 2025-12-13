const mongoose = require('mongoose');

const subscriptionOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  planDetails: {
    type: Object,
    required: true
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'upi'
  },
  orderNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'pending_payment',
      'payment_submitted',
      'payment_verified',
      'active',
      'cancelled',
      'expired',
      'payment_failed'
    ],
    default: 'pending_payment'
  },
  deliveryAddress: {
    type: Object,
    default: null
  },
  deliveryType: {
    type: String,
    default: 'subscription'
  },
  pincode: {
    type: String,
    default: ''
  },
  paymentProof: {
    type: String,
    default: null
  },
  paymentProofUrl: {
    type: String,
    default: null
  },
  paymentSubmittedAt: {
    type: Date,
    default: null
  },
  paymentVerifiedAt: {
    type: Date,
    default: null
  },
  subscriptionStartDate: {
    type: Date,
    default: null
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userDetails: {
    name: String,
    email: String,
    contact: String
  }
}, {
  timestamps: true
});

// Calculate subscription end date based on duration
subscriptionOrderSchema.methods.calculateEndDate = function() {
  if (!this.subscriptionStartDate || !this.planDetails.duration) return null;
  
  const startDate = new Date(this.subscriptionStartDate);
  const duration = this.planDetails.duration;
  
  let daysToAdd = 0;
  
  // Parse duration string like "30 days", "7 days", etc.
  const match = duration.match(/(\d+)\s*days?/i);
  if (match) {
    daysToAdd = parseInt(match[1]);
  } else if (duration.toLowerCase().includes('month')) {
    daysToAdd = 30; // Default 30 days for monthly
  } else if (duration.toLowerCase().includes('week')) {
    daysToAdd = 7; // Default 7 days for weekly
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + daysToAdd);
  
  return endDate;
};

module.exports = mongoose.model('SubscriptionOrder', subscriptionOrderSchema);