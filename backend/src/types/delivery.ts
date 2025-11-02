import mongoose from "mongoose";
import type { User } from "./user";

export interface IDelivery {
  deliveryPerson: mongoose.Schema.Types.ObjectId | User;
  order: mongoose.Schema.Types.ObjectId;
  status: "Pending" | "Accepted" | "PickedUp" | "OnTheWay" | "Delivered" | "Cancelled";
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  deliveryFee: number;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}
