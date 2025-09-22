import mongoose from "mongoose";
// Store Model (For Merchant's clothing store details)
const storeSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    },
    storeDescription: {
      type: String,
      trim: true
    },
    storeImages: [{
      type: String, // URLs to store images
    }],
    address: {
      type: String,
      required: true,
      trim: true
    },
    mapLink: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      phone: String,
      email: String,
      website: String
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
      totalReviews: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
  }, {
    timestamps: true
  });

storeSchema.index({ userId: 1 });
storeSchema.index({ storeName: 1 });

const Store = mongoose.model('Store', storeSchema);

export default Store;

  