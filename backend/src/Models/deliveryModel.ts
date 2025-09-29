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

const DeliveryModel = mongoose.model<IDelivery>("Delivery", deliverySchema);

export default DeliveryModel;
