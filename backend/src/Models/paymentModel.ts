import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  order: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  store: mongoose.Schema.Types.ObjectId;
  amount: number;
  paymentMethod: "COD" | "Online";
  paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded" | "PartialRefund";
  
  // Online payment details
  paymentGateway?: string; // e.g., "Razorpay", "Stripe", "PayPal"
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  
  // Transaction details
  transactionId?: string;
  transactionDate?: Date;
  
  // Refund details
  refundAmount?: number;
  refundReason?: string;
  refundDate?: Date;
  refundTransactionId?: string;
  
  // COD specific
  codCollectedBy?: mongoose.Schema.Types.ObjectId; // Delivery person who collected
  codCollectedAt?: Date;
  codSubmittedToStore?: boolean;
  codSubmittedAt?: Date;
  
  // Payout to merchant
  payoutStatus: "Pending" | "Processing" | "Completed" | "Failed";
  payoutAmount?: number;
  payoutDate?: Date;
  payoutTransactionId?: string;
  
  // Metadata
  metadata?: any;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema: Schema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded", "PartialRefund"],
      default: "Pending"
    },
    
    // Online payment details
    paymentGateway: {
      type: String,
      trim: true
    },
    gatewayOrderId: {
      type: String,
      trim: true
    },
    gatewayPaymentId: {
      type: String,
      trim: true
    },
    gatewaySignature: {
      type: String,
      trim: true
    },
    
    // Transaction details
    transactionId: {
      type: String,
      trim: true
    },
    transactionDate: {
      type: Date
    },
    
    // Refund details
    refundAmount: {
      type: Number,
      min: 0
    },
    refundReason: {
      type: String,
      trim: true
    },
    refundDate: {
      type: Date
    },
    refundTransactionId: {
      type: String,
      trim: true
    },
    
    // COD specific
    codCollectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    codCollectedAt: {
      type: Date
    },
    codSubmittedToStore: {
      type: Boolean,
      default: false
    },
    codSubmittedAt: {
      type: Date
    },
    
    // Payout to merchant
    payoutStatus: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending"
    },
    payoutAmount: {
      type: Number,
      min: 0
    },
    payoutDate: {
      type: Date
    },
    payoutTransactionId: {
      type: String,
      trim: true
    },
    
    // Metadata
    metadata: {
      type: Schema.Types.Mixed
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ store: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ payoutStatus: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });

const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);

export default PaymentModel;


