import express from 'express';
import { onboarding, verifyOtp, getProfile, registerUser, loginUser, completeProfile, updateProfile, getUserStats } from '../controllers/usercontroller';
import { isAuthenticated } from '../middleware/auth';

const userRoute = express.Router();

// Send OTP for phone verification
userRoute.post('/onboarding', onboarding);
// Verify OTP code
userRoute.post('/verify-otp', verifyOtp);
// Register new user account
userRoute.post('/register', registerUser);
// Login existing user
userRoute.post('/login', loginUser);
// Get user profile (requires authentication)
userRoute.get('/profile', isAuthenticated, getProfile);
// Update user profile (requires authentication)
userRoute.put('/profile', isAuthenticated, updateProfile);
// Get user stats (requires authentication)
userRoute.get('/stats', isAuthenticated, getUserStats);
// Complete user profile with additional details (requires authentication)
userRoute.post('/complete-profile', isAuthenticated, completeProfile);

export default userRoute;