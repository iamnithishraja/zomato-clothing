import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true, // This allows multiple null values while maintaining uniqueness for non-null values
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // This allows multiple null values while maintaining uniqueness for non-null values
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "merchant", "delivery"],
    default: "user",
    required: true,
  },
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;