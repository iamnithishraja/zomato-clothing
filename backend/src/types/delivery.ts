import mongoose, { type Document } from "mongoose";
import type { User } from "./user";

export interface IDelivery extends Document {
  deliveryPerson: mongoose.Types.ObjectId | User;
  order: mongoose.Types.ObjectId;
  status: "Pending" | "Accepted" | "PickedUp" | "OnTheWay" | "Delivered" | "Cancelled";
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  deliveryFee: number;
  deliveryNotes?: string;
  cancellationReason?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

