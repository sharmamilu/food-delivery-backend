const express = require('express');
const router = express.Router();
const {
  createSubscriptionOrder,
  submitSubscriptionPayment,
  verifySubscriptionPayment,
  getUserSubscriptionOrders,
  getSubscriptionOrderById,
  getAllSubscriptionOrders,
  updateSubscriptionOrderStatus,
  cancelSubscriptionOrder
} = require('../controllers/subscriptionOrderController');
const adminauthMiddleware = require('../middleware/adminauthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
// Public routes (for frontend payment submission)
router.post('/create', adminauthMiddleware, createSubscriptionOrder);
router.post('/:orderId/submit-payment', authMiddleware, submitSubscriptionPayment);
router.get('/:orderId', getSubscriptionOrderById);
router.get('/user/:userId', getUserSubscriptionOrders);
router.post('/:orderId/cancel', authMiddleware, cancelSubscriptionOrder);

// Admin routes (protected)
router.put('/:orderId/verify-payment', adminauthMiddleware,  verifySubscriptionPayment);
router.get('/admin/all', adminauthMiddleware,  getAllSubscriptionOrders);
router.put('/admin/:orderId/update-status', adminauthMiddleware,  updateSubscriptionOrderStatus);

module.exports = router;