import mongoose from "mongoose";
import type { User } from "./user";

export interface IOrderItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  price: number; // Price at the time of order
}

export interface IOrder {
  user: mongoose.Schema.Types.ObjectId | User;
  store: mongoose.Schema.Types.ObjectId;
  orderItems: IOrderItem[];
  totalAmount: number;
  orderDate: Date;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod: "COD" | "Online";
  paymentStatus: "Pending" | "Completed" | "Failed";
  deliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
