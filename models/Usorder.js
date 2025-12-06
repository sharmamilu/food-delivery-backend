const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['veg', 'non-veg'],
  },
  category: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

const addressSchema = new mongoose.Schema({
  id: String,
  type: String,
  address: String,
  isDefault: Boolean,
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
});

const usorderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    deliveryAddress: addressSchema,
    paymentMethod: {
      type: String,
      default: 'upi',
    },
    orderNotes: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'payment_received',
        'payment_verified',
        'preparing',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending_payment',
    },
    deliveryType: {
      type: String,
    },
    pincode: {
      type: String,
    },
    paymentProof: {
      type: String, // Cloudinary URL
    },
    paymentSubmittedAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Usorder', usorderSchema);