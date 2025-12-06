const express = require('express');
const router = express.Router();
const {
  createOrder,
  submitPaymentProof,
  getOrderById,
  getUserOrders,
  verifyPayment,
} = require('../controllers/usorderController');

// Create new order
router.post('/create', createOrder);

// Submit payment proof
router.post('/:orderId/submit-payment', submitPaymentProof);

// Get order details
router.get('/:orderId', getOrderById);

// Get all orders for a user
router.get('/user/:userId', getUserOrders);

// Admin: Verify payment (you can add authentication middleware later)
router.put('/:orderId/verify-payment', verifyPayment);

module.exports = router;