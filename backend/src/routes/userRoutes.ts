import express from 'express';
import { onboarding, verifyOtp, getProfile, emailRegister, emailLogin, getAllUsers} from '../controllers/usercontroller';
import { isAuthenticated } from '../middleware/auth';

const userRoute = express.Router();

userRoute.post('/onboarding', onboarding);
userRoute.post('/verify-otp', verifyOtp);
userRoute.post('/register', emailRegister);
userRoute.post('/login', emailLogin);
userRoute.get('/profile', isAuthenticated, getProfile);
userRoute.get('/all-users', getAllUsers); // Debug endpoint

export default userRoute;