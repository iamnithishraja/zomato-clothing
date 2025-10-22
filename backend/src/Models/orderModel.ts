import mongoose, { Schema, Document } from "mongoose";
import { type IOrder, type IOrderItem } from "../types/order";

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0
  }
}, { _id: false });

const orderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true
    },
    store: { 
      type: Schema.Types.ObjectId, 
      ref: "Store", 
      required: true
    },
    orderItems: {
      type: [orderItemSchema],
      required: true
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true
    },
    itemsTotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: { 
      type: Number, 
      required: true, 
      min: 0
    },
    orderDate: { 
      type: Date, 
      default: Date.now
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Processing", "ReadyForPickup", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    merchantAcceptedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending"
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment"
    },
    deliveryPerson: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    deliveryDate: { 
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    },
    statusHistory: [{
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      note: String
    }]
  },
  { 
    timestamps: true
  }
);

const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;
