const SubscriptionOrder = require('../models/SubscriptionOrder');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');

// Create new subscription order
const createSubscriptionOrder = async (req, res) => {
  try {
    const {
      orderId,
      userId,
      planId,
      planDetails,
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod,
      orderNotes,
      deliveryType,
      pincode,
      deliveryAddress
    } = req.body;

    // Fetch user details
    let userDetails = null;
    try {
      const user = await User.findById(userId).select('name email contact');
      if (user) {
        userDetails = {
          name: user.name || 'Unknown User',
          email: user.email || 'No email',
          contact: user.contact || 'No phone',
        };
      }
    } catch (userError) {
      console.error('Error fetching user details:', userError);
    }

    // Check if subscription plan exists
    const plan = await SubscriptionPlan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const newSubscriptionOrder = new SubscriptionOrder({
      orderId,
      userId,
      planId,
      planDetails,
      subtotal,
      deliveryFee,
      tax,
      total,
      paymentMethod,
      orderNotes,
      deliveryType,
      pincode,
      deliveryAddress,
      status: 'pending_payment',
      userDetails,
      subscriptionStartDate: null,
      subscriptionEndDate: null
    });

    await newSubscriptionOrder.save();

    res.status(201).json({
      success: true,
      message: 'Subscription order created successfully',
      order: newSubscriptionOrder
    });
  } catch (error) {
    console.error('Create subscription order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription order',
      error: error.message
    });
  }
};

// Submit payment proof for subscription order
const submitSubscriptionPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentProof, userId } = req.body;

    if (!paymentProof) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof is required'
      });
    }

    const order = await SubscriptionOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Subscription order not found'
      });
    }

    // Verify user owns this order
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this order'
      });
    }

    let paymentProofUrl = null;
    
    // Upload to Cloudinary if paymentProof is base64
    if (paymentProof.startsWith('data:image')) {
      try {
        const uploadResult = await uploadToCloudinary(paymentProof, 'subscription_payments');
        paymentProofUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Still save the base64 string if upload fails
      }
    }

    // Update order with payment proof
    order.paymentProof = paymentProof;
    order.paymentProofUrl = paymentProofUrl;
    order.status = 'payment_submitted';
    order.paymentSubmittedAt = new Date();
    order.subscriptionStartDate = new Date(); // Start subscription from payment submission
    order.subscriptionEndDate = order.calculateEndDate();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentSubmittedAt: order.paymentSubmittedAt,
        subscriptionStartDate: order.subscriptionStartDate,
        subscriptionEndDate: order.subscriptionEndDate,
        paymentProofUrl: order.paymentProofUrl
      }
    });
  } catch (error) {
    console.error('Submit subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit payment proof',
      error: error.message
    });
  }
};

// Verify subscription payment (Admin function)
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await SubscriptionOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Subscription order not found'
      });
    }

    if (order.status !== 'payment_submitted') {
      return res.status(400).json({
        success: false,
        message: `Order status is ${order.status}, expected payment_submitted`
      });
    }

    // Update order status
    order.status = 'payment_verified';
    order.paymentVerifiedAt = new Date();

    // Mark subscription as active
    if (!order.subscriptionStartDate) {
      order.subscriptionStartDate = new Date();
    }
    if (!order.subscriptionEndDate) {
      order.subscriptionEndDate = order.calculateEndDate();
    }

    await order.save();

    // Here you could trigger:
    // 1. Send confirmation email/SMS
    // 2. Update user's active subscription status
    // 3. Start meal delivery scheduling

    res.status(200).json({
      success: true,
      message: 'Subscription payment verified successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        subscriptionStartDate: order.subscriptionStartDate,
        subscriptionEndDate: order.subscriptionEndDate,
        planDetails: order.planDetails
      }
    });
  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

// Get user's subscription orders
const getUserSubscriptionOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await SubscriptionOrder.find({ 
      userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get user subscription orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription orders',
      error: error.message
    });
  }
};

// Get subscription order by ID
const getSubscriptionOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await SubscriptionOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Subscription order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get subscription order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription order',
      error: error.message
    });
  }
};


// Update subscription order status (Admin)
const updateSubscriptionOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending_payment',
      'payment_submitted',
      'payment_verified',
      'active',
      'cancelled',
      'expired',
      'payment_failed'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await SubscriptionOrder.findOneAndUpdate(
      { orderId },
      { $set: { status } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Subscription order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription order status updated',
      order
    });
  } catch (error) {
    console.error('Update subscription order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Cancel subscription order
const cancelSubscriptionOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body;

    const order = await SubscriptionOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Subscription order not found'
      });
    }

    // Verify user owns this order
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this order'
      });
    }

    // Only allow cancellation if payment not verified yet
    if (order.status === 'payment_verified' || order.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel active or verified subscription'
      });
    }

    order.status = 'cancelled';
    order.isActive = false;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Subscription order cancelled',
      order
    });
  } catch (error) {
    console.error('Cancel subscription order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

const getAllSubscriptionOrders = async (req, res) => {
  try {
    const orders = await SubscriptionOrder.find();

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription orders",
    });
  }
};


module.exports = {
  createSubscriptionOrder,
  submitSubscriptionPayment,
  verifySubscriptionPayment,
  getUserSubscriptionOrders,
  getSubscriptionOrderById,
  getAllSubscriptionOrders,
  updateSubscriptionOrderStatus,
  cancelSubscriptionOrder
};