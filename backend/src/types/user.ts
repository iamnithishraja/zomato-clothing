import mongoose from "mongoose";
export type UserRole = "User" | "Merchant" | "Delivery";

export interface User {
    _id: mongoose.Types.ObjectId;
    name?: string;
    phone?: string | null;
    email?: string | null;
    password?: string;
    gender?: string;
    avatar?: string | null;
    addresses?: string[];
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
    role: UserRole;
    otp?: string;
    otpExpiry?: Date;
    isActive: boolean;
    // Delivery partner specific fields
    currentLocation?: {
      lat: number;
      lng: number;
    };
    isBusy?: boolean;
    currentOrder?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  }