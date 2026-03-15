import AdminModel from './admin.model';
import { generateOTP } from '../utils/otp';
import { sendPhoneOtp } from '../utils/sms';
import { generateAdminToken } from '../utils/token';
import type { Admin } from '../types/admin';

export class AdminService {
  // Create new admin
  static async createAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ admin: Admin; token: string }> {
    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({
      $or: [
        { email: adminData.email },
        { username: adminData.username },
        ...(adminData.phone ? [{ phone: adminData.phone }] : [])
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.email === adminData.email) {
        throw new Error('Admin with this email already exists');
      }
      if (existingAdmin.username === adminData.username) {
        throw new Error('Admin with this username already exists');
      }
      if (existingAdmin.phone === adminData.phone) {
        throw new Error('Admin with this phone number already exists');
      }
    }

    // Create new admin
    const admin = new AdminModel(adminData);
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id);

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return { admin: adminResponse, token };
  }

  // Login with username and password
  static async loginWithPassword(credentials: {
    username: string;
    password: string;
  }): Promise<{ admin: Admin; token: string }> {
    // Find admin by username or email
    const admin = await AdminModel.findOne({
      $or: [
        { username: credentials.username },
        { email: credentials.username }
      ]
    });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id);

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return { admin: adminResponse, token };
  }

  // Request OTP for phone login
  static async requestOTP(phone: string): Promise<void> {
    // Clean and validate phone number (reuse existing validation)
    const phoneValidation = this.cleanAndValidatePhone(phone);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.error || 'Invalid phone number format');
    }

    const cleanPhone = phoneValidation.cleanPhone;

    // Find admin by phone
    const admin = await AdminModel.findOne({ phone: cleanPhone });
    if (!admin) {
      throw new Error('No admin account found with this phone number');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Generate OTP
    const otp = admin.generateOTP();
    await admin.save();

    // Send OTP
    const smsResult = await sendPhoneOtp(cleanPhone, otp);
    if (!smsResult) {
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP and login
  static async verifyOTPAndLogin(phone: string, otp: string): Promise<{ admin: Admin; token: string }> {
    // Clean and validate phone number
    const phoneValidation = this.cleanAndValidatePhone(phone);
    if (!phoneValidation.isValid) {
      throw new Error(phoneValidation.error || 'Invalid phone number format');
    }

    const cleanPhone = phoneValidation.cleanPhone;

    // Find admin by phone
    const admin = await AdminModel.findOne({ phone: cleanPhone });
    if (!admin) {
      throw new Error('No admin account found with this phone number');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Verify OTP
    const isOTPValid = admin.verifyOTP(otp);
    if (!isOTPValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    admin.clearOTP();
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id);

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return { admin: adminResponse, token };
  }

  // Get admin profile
  static async getAdminProfile(adminId: string): Promise<Admin> {
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    // Remove sensitive data
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.otp;

    return adminResponse;
  }

  // Utility function to clean and validate phone numbers (reused from userController)
  private static cleanAndValidatePhone(phone: string): { cleanPhone: string; isValid: boolean; error?: string } {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Remove country code if present (91 for India)
    const withoutCountryCode = cleaned.replace(/^91/, '');
    
    // Validate length
    if (withoutCountryCode.length !== 10) {
      return {
        cleanPhone: '',
        isValid: false,
        error: 'Phone number must be exactly 10 digits after removing country code'
      };
    }
    
    // Validate that it's a valid Indian mobile number (starts with 6, 7, 8, or 9)
    if (!/^[6-9]/.test(withoutCountryCode)) {
      return {
        cleanPhone: '',
        isValid: false,
        error: 'Invalid phone number. Indian mobile numbers must start with 6, 7, 8, or 9'
      };
    }
    
    return {
      cleanPhone: withoutCountryCode,
      isValid: true
    };
  }
}
