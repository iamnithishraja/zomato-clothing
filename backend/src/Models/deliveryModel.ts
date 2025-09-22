import mongoose from "mongoose";
// Delivery Person Model (Extended user info for delivery personnel)
const deliveryPersonSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleNumber: {
      type: String,
      required: true
    },
    workingAreas: [String], // Array of area names where they deliver
    currentLocation: {
      address: String,
      mapLink: String,
      required: true
    },
    availability: {
      isAvailable: { type: Boolean, default: true },
      required: true
    },
    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      required: true
    },
    earnings: {
      totalEarned: { type: Number, default: 0 },
      pendingPayment: { type: Number, default: 0 },
      required: true
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
    },
  }, {
    timestamps: true
  });
  
  // Create indexes for better performance
  deliveryPersonSchema.index({ "availability.isAvailable": 1 });
  
  const DeliveryPerson = mongoose.model("DeliveryPerson", deliveryPersonSchema);
  
  export default DeliveryPerson;