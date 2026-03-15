import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  otp: {
    code: {
      type: String,
      default: null
    },
    expiry: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Method to generate OTP
adminSchema.methods.generateOTP = function(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  };
  return otp;
};

// Method to verify OTP
adminSchema.methods.verifyOTP = function(candidateOtp: string): boolean {
  if (!this.otp || !this.otp.code || !this.otp.expiry) {
    return false;
  }
  
  if (this.otp.expiry < new Date()) {
    return false;
  }
  
  return this.otp.code === candidateOtp;
};

// Method to clear OTP
adminSchema.methods.clearOTP = function(): void {
  this.otp = {
    code: null,
    expiry: null
  };
};

const AdminModel = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default AdminModel;
