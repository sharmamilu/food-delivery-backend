const express = require("express");
const router = express.Router();
const {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getPlansByType,
  getAllSubscriptionOrders,
} = require("../controllers/subscriptionController");
const adminauthMiddleware = require("../middleware/adminauthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
// Public routes
router.get("/plans", authMiddleware, getAllSubscriptionPlans);
router.get("/plans/:planId", getSubscriptionPlanById);
router.get("/plans/type/:planType", getPlansByType);

// Admin routes (protected)
router.post("/plans/create", adminauthMiddleware, createSubscriptionPlan);
router.put(
  "/plans/:planId/update",
  adminauthMiddleware,
  updateSubscriptionPlan
);
router.delete(
  "/plans/:planId/delete",
  adminauthMiddleware,
  deleteSubscriptionPlan
);
router.get("/orders", getAllSubscriptionOrders);

module.exports = router;
