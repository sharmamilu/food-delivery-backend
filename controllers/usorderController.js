const Order = require("../models/Usorder");
const User = require("../models/User"); // Make sure to import User model
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      orderId,
      userId,
      items,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      paymentMethod,
      orderNotes,
      deliveryType,
      pincode,
    } = req.body;

    // Fetch user details
    let userDetails = null;
    try {
      const user = await User.findById(userId).select("name email contact");
      if (user) {
        userDetails = {
          name: user.name || "Unknown User",
          email: user.email || "No email",
          contact: user.contact || "No phone",
        };
      }
    } catch (userError) {
      console.error("Error fetching user details:", userError);
      // Continue without user details if there's an error
    }

    const newOrder = new Order({
      orderId,
      userId,
      items,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      paymentMethod,
      orderNotes,
      deliveryType,
      pincode,
      status: "pending_payment",
      userDetails: userDetails, // Add user details to the order
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// Submit payment proof
const submitPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentProof, userId } = req.body;

    // Find the order
    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if payment is already submitted
    if (order.status !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: "Payment already submitted for this order",
      });
    }

    // Upload screenshot to Cloudinary
    let cloudinaryUrl = null;
    if (paymentProof) {
      const uploadResult = await uploadToCloudinary(paymentProof);
      cloudinaryUrl = uploadResult.url;
    }

    // Update order with payment details
    order.paymentProof = cloudinaryUrl;
    order.status = "payment_received";
    order.paymentSubmittedAt = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment proof submitted successfully",
      order: {
        id: order.orderId,
        status: order.status,
        paymentProof: order.paymentProof,
        paymentSubmittedAt: order.paymentSubmittedAt,
      },
    });
  } catch (error) {
    console.error("Submit payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit payment proof",
      error: error.message,
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.query;

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order details",
      error: error.message,
    });
  }
};

// Get all orders for a user
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get user orders with pagination
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Order.countDocuments({ userId });
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user orders",
      error: error.message,
    });
  }
};

// Admin: Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { isVerified } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "payment_received") {
      return res.status(400).json({
        success: false,
        message: "Payment not submitted yet",
      });
    }

    order.isVerified = isVerified;
    order.status = isVerified ? "payment_verified" : "payment_received";

    await order.save();

    res.status(200).json({
      success: true,
      message: `Payment ${isVerified ? "verified" : "unverified"} successfully`,
      order: {
        id: order.orderId,
        status: order.status,
        isVerified: order.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// Get all orders (for admin)
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;

    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      totalPages,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

// Get orders with pending verification
// const getPendingVerificationOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       status: 'payment_received',
//       isVerified: false
//     }).sort({ paymentSubmittedAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: orders.length,
//       orders,
//     });
//   } catch (error) {
//     console.error('Get pending verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get pending verification orders',
//       error: error.message,
//     });
//   }
// };

const getPendingVerificationOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get pending orders with pagination
    const orders = await Order.find({
      status: "payment_received",
      isVerified: false,
    })
      .sort({ paymentSubmittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("userDetails", "name email contact");

    // Get total count
    const total = await Order.countDocuments({
      status: "payment_received",
      isVerified: false,
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      orders,
    });
  } catch (error) {
    console.error("Get pending verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending verification orders",
      error: error.message,
    });
  }
};

// Update order status (for admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, isVerified } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update fields if provided
    if (status) {
      order.status = status;
    }

    if (isVerified !== undefined) {
      order.isVerified = isVerified;

      // If verifying payment, update status accordingly
      if (isVerified && order.status === "payment_received") {
        order.status = "payment_verified";
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

const getUserOrderById = async (req, res) => {
  try {
    const { userId, orderId } = req.params; // Get from URL params, not query

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get user order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user order by ID",
      error: error.message,
    });
  }
};
// const getVerifiedOrders = async (req, res) => {
//    try {
//     const orders = await Order.find({
//       isVerified: true,
//       status: { $in: ['preparing', 'out_for_delivery', 'delivered'] }
//     })
//     .sort({ updatedAt: -1 });

//     res.json({
//       success: true,
//       orders: orders
//     });
//   } catch (error) {
//     console.error('Get verified orders error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch verified orders'
//     });
//   }
// }
const getDeliveredOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get verified orders with pagination
    const orders = await Order.find({
      isVerified: true,
      status: "delivered",
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("userDetails", "name email contact");

    // Get total count
    const total = await Order.countDocuments({
      isVerified: true,
      status: "delivered",
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      orders,
    });
  } catch (error) {
    console.error("Get delivered orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivered orders",
    });
  }
};

const getVerifiedOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get verified orders with pagination
    const orders = await Order.find({
      isVerified: true,
      status: { $in: ["preparing", "out_for_delivery"] },
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("userDetails", "name email contact");

    // Get total count
    const total = await Order.countDocuments({
      isVerified: true,
      status: { $in: ["preparing", "out_for_delivery"] },
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      orders,
    });
  } catch (error) {
    console.error("Get verified orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch verified orders",
    });
  }
};
// Add at the end of exports:
module.exports = {
  createOrder,
  submitPaymentProof,
  getOrderById,
  getUserOrders,
  verifyPayment,
  getAllOrders,
  getUserOrderById,
  getPendingVerificationOrders,
  updateOrderStatus,
  getVerifiedOrders,
  getDeliveredOrders,
};
