import { Router } from 'express';
import {
  adminSignup,
  adminLoginPassword,
  adminRequestOtp,
  adminVerifyOtp,
  getAdminProfile
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

export default router;
