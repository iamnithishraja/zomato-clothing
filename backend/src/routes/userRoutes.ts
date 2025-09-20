import express from 'express';
import { onboarding, verifyOtp, getProfile} from '../controllers/usercontroller';
import { isAuthenticated } from '../middleware/auth';

const userRoute = express.Router();

userRoute.post('/onboarding', onboarding);
userRoute.post('/verify-otp', verifyOtp);
userRoute.get('/profile', isAuthenticated, getProfile);

export default userRoute;