import { AdminService } from './admin.service';
import type { Response, Request } from 'express';
import z from 'zod';
import type { CustomRequest } from '../types';

// Validation schemas
const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional()
});

const loginPasswordSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});

const requestOtpSchema = z.object({
  phone: z.string().min(1, 'Phone number is required')
});

const verifyOtpSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

// Admin signup
export async function adminSignup(req: Request, res: Response) {
  try {
    const validatedData = signupSchema.parse(req.body);
    
    const result = await AdminService.createAdmin(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Admin signup error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create admin account'
    });
  }
}

// Admin login with password
export async function adminLoginPassword(req: Request, res: Response) {
  try {
    const validatedData = loginPasswordSchema.parse(req.body);
    
    const result = await AdminService.loginWithPassword(validatedData);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
}

// Request OTP for admin login
export async function adminRequestOtp(req: Request, res: Response) {
  try {
    const validatedData = requestOtpSchema.parse(req.body);
    
    await AdminService.requestOTP(validatedData.phone);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error: any) {
    console.error('Admin request OTP error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
}

// Verify OTP and login
export async function adminVerifyOtp(req: Request, res: Response) {
  try {
    const validatedData = verifyOtpSchema.parse(req.body);
    
    const result = await AdminService.verifyOTPAndLogin(validatedData.phone, validatedData.otp);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    console.error('Admin verify OTP error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || 'OTP verification failed'
    });
  }
}

// Get admin profile
export async function getAdminProfile(req: CustomRequest, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not authenticated'
      });
    }
    
    const admin = await AdminService.getAdminProfile(req.admin._id);
    
    res.status(200).json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: { admin }
    });
  } catch (error: any) {
    console.error('Get admin profile error:', error);
    
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to get admin profile'
    });
  }
}
