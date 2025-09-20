import mongoose from "mongoose";
export type UserRole = "user" | "marchant" | "delivery";

export interface User {
    _id: mongoose.Types.ObjectId;
    phone?: string | null;
    isPhoneVerified: boolean;
    role: UserRole;
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
  }