import mongoose from "mongoose";
import type { User } from "./user";

export interface IDelivery {
  deliveryPerson: mongoose.Schema.Types.ObjectId | User;
  order: mongoose.Schema.Types.ObjectId;
  status: "Pending" | "Accepted" | "PickedUp" | "Delivered" | "Cancelled";
  pickupAddress: string;
  deliveryAddress: string;
  deliveryTime: Date;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}
