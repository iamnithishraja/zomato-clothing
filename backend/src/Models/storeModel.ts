import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  storeName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  storeImages: [{ 
    type: String, 
  }],

  address: {
    type: String,
    required: true,
    trim: true,
  },
  mapLink: {
    type: String,
    required: true,
    trim: true,
  },

  contact: {
    phone: {
      type: String,
      maxlength: 12,
      minlength: 10,
    },
    email: {
      type: String,
      maxlength: 320,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },

  workingDays: {
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },

  rating: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

storeSchema.index({ merchantId: 1 });
storeSchema.index({ storeName: 1 });

const Store = mongoose.model("Store", storeSchema);
export default Store;
