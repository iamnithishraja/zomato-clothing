import mongoose from "mongoose";
export type UserRole = "user" | "merchant" | "delivery";

export interface User {
    _id: mongoose.Types.ObjectId;
    name?: string;
    phone?: string | null;
    email?: string | null;
    password?: string;
    gender?: string;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
    role: UserRole;
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
  }