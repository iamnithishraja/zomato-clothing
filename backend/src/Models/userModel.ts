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

  // Delivery partner specific fields
  currentLocation: {
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    }
  },
  isBusy: {
    type: Boolean,
    default: false,
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
}, {
  timestamps: true,
});

// Database indexes for optimized queries
// Note: phone and email already have unique indexes from their schema definition
userSchema.index({ role: 1 }); // Query users by role
userSchema.index({ role: 1, isActive: 1 }); // Find active users by role (e.g., available delivery partners)

const User = mongoose.model("User", userSchema);
export default User;
