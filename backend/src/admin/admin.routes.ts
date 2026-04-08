import { Router } from 'express';
import {
  adminSignup,
  adminLoginPassword,
  adminRequestOtp,
  adminVerifyOtp,
  getAdminProfile,
  getAnalyticsOverview,
  getFinanceSummary,
  getTransactions,
  getAllOrders,
  getAdminOrderById,
  forceCancelOrder,
  getAllUsers,
  getAdminUserStats,
  getDeliveryPartners,
  getDeliveryStats,
  getStorePerformance,
  getAdminStoreDetail,
} from './admin.controller';
import { isAdminAuthenticated } from './admin.middleware';

const router = Router();

// Public routes
router.post('/auth/signup', adminSignup);
router.post('/auth/login-password', adminLoginPassword);
router.post('/auth/request-otp', adminRequestOtp);
router.post('/auth/verify-otp', adminVerifyOtp);

// Protected routes
router.get('/profile', isAdminAuthenticated, getAdminProfile);

// ─── Dashboard Routes (all protected) ──────────────────────────────────────

// Analytics
router.get('/analytics/overview', isAdminAuthenticated, getAnalyticsOverview);

// Finance
router.get('/finance/summary', isAdminAuthenticated, getFinanceSummary);
router.get('/finance/transactions', isAdminAuthenticated, getTransactions);

// Orders
router.get('/orders', isAdminAuthenticated, getAllOrders);
router.get('/orders/:id', isAdminAuthenticated, getAdminOrderById);
router.patch('/orders/:id/cancel', isAdminAuthenticated, forceCancelOrder);

// Users
router.get('/users', isAdminAuthenticated, getAllUsers);
router.get('/users/stats', isAdminAuthenticated, getAdminUserStats);

// Delivery Partners
router.get('/delivery-partners', isAdminAuthenticated, getDeliveryPartners);
router.get('/delivery-partners/stats', isAdminAuthenticated, getDeliveryStats);

// Stores
router.get('/stores/performance', isAdminAuthenticated, getStorePerformance);
router.get('/stores/:id/detail', isAdminAuthenticated, getAdminStoreDetail);

export default router;
