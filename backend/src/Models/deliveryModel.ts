import mongoose, { Schema, Document } from "mongoose";
import type { IDelivery } from "../types/delivery";

const deliverySchema: Schema = new Schema(
  {
    deliveryPerson: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    order: { 
      type: Schema.Types.ObjectId, 
      ref: "Order", 
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "PickedUp", "Delivered", "Cancelled"],
      default: "Pending"
    },
    pickupAddress: { 
      type: String, 
      required: true,
      trim: true
    },
    deliveryAddress: { 
      type: String, 
      required: true,
      trim: true
    },
    estimatedDeliveryTime: { 
      type: Date, 
      required: true
    },
    actualDeliveryTime: { 
      type: Date
    },
    deliveryFee: { 
      type: Number, 
      required: true, 
      min: 0
    },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5
    },
    review: { 
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true
  }
);

// Database indexes for optimized queries
deliverySchema.index({ deliveryPerson: 1, status: 1 }); // Delivery person's deliveries by status
deliverySchema.index({ order: 1 }); // Lookup delivery by order
deliverySchema.index({ status: 1, createdAt: -1 }); // Query deliveries by status and date
deliverySchema.index({ deliveryPerson: 1, createdAt: -1 }); // Delivery person history

const DeliveryModel = mongoose.model<IDelivery>("Delivery", deliverySchema);

export default DeliveryModel;
