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
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending"
    },
    deliveryDate: { 
      type: Date
    }
  },
  { 
    timestamps: true
  }
);

const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;
