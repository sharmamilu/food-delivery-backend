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
  getUserOrderById,
  getVerifiedOrders,
  getDeliveredOrders
} = require('../controllers/usorderController');
const adminauthMiddleware = require('../middleware/adminauthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
// Create new order
router.post('/create', createOrder);

// Submit payment proof
router.post('/:orderId/submit-payment', submitPaymentProof);

// Get order details
router.get('/:orderId', getOrderById);

// Get all orders for a user
router.get('/user/:userId', authMiddleware, getUserOrders);

// Admin: Verify payment (you can add authentication middleware later)
router.put('/:orderId/verify-payment', adminauthMiddleware, verifyPayment);

router.get('/admin/all', adminauthMiddleware, getAllOrders);
router.get('/admin/pending', adminauthMiddleware, getPendingVerificationOrders);
router.put('/admin/:orderId/update-status', adminauthMiddleware, updateOrderStatus);
router.put('/:orderId/verify-payment', adminauthMiddleware, verifyPayment);
  router.get('/user/:userId/:orderId',  getUserOrderById); 
  router.get('/admin/verified', adminauthMiddleware, getVerifiedOrders);
  router.get('/admin/delivered', adminauthMiddleware, getDeliveredOrders);
module.exports = router;