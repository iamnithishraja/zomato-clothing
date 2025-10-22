import mongoose from "mongoose";
import type { User } from "./user";

export interface IOrderItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  price: number; // Price at the time of order
}

export interface IOrderStatusHistory {
  status: string;
  timestamp: Date;
  updatedBy?: mongoose.Schema.Types.ObjectId | User;
  note?: string;
}

export interface IOrder {
  orderNumber?: string;
  user: mongoose.Schema.Types.ObjectId | User;
  store: mongoose.Schema.Types.ObjectId;
  orderItems: IOrderItem[];
  shippingAddress: string;
  itemsTotal: number;
  deliveryFee: number;
  totalAmount: number;
  orderDate: Date;
  status: "Pending" | "Accepted" | "Rejected" | "Processing" | "ReadyForPickup" | "Shipped" | "Delivered" | "Cancelled";
  merchantAcceptedAt?: Date;
  rejectionReason?: string;
  paymentMethod: "COD" | "Online";
  paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded";
  paymentId?: mongoose.Schema.Types.ObjectId;
  deliveryPerson?: mongoose.Schema.Types.ObjectId | User;
  deliveryDate?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  notes?: string;
  statusHistory: IOrderStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}
