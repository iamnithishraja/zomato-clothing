import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String, // bcrypt-hashed
  },
    // Avatar/profile picture
  avatar: {
    type: String, // S3 URL
    default: null,
    },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },

  // Addresses list (Zomato-like)
  addresses: {
    type: [String],
    default: [],
  },

  // Role management
  role: {
    type: String,
    enum: ["User", "Merchant", "Delivery"],
    default: "User",
    required: true,
  },

  // Verification flags
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
  // Security / auth fields
  otp: String,
  otpExpiry: Date,

  // Meta fields
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);
export default User;
