import express from 'express';
import { onboarding, verifyOtp, getProfile, registerUser, loginUser } from '../controllers/usercontroller';
import { isAuthenticated } from '../middleware/auth';

const userRoute = express.Router();

userRoute.post('/onboarding', onboarding);
userRoute.post('/verify-otp', verifyOtp);
userRoute.post('/register', registerUser);
userRoute.post('/login', loginUser);
userRoute.get('/profile', isAuthenticated, getProfile);

export default userRoute;