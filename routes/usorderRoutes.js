const express = require('express');
const router = express.Router();
const {
  createOrder,
  submitPaymentProof,
  getOrderById,
  getUserOrders,
  verifyPayment,
  getAllOrders,
  getPendingVerificationOrders,
  updateOrderStatus,
  getUserOrderById
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

router.get('/admin/all', getAllOrders);
router.get('/admin/pending', getPendingVerificationOrders);
router.put('/admin/:orderId/update-status', updateOrderStatus);
router.put('/:orderId/verify-payment',verifyPayment);
  router.get('/user/:userId/:orderId', getUserOrderById); 
module.exports = router;