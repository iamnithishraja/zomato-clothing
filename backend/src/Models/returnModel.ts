import mongoose, { Schema } from "mongoose";
import type { IReturn } from "../types/return";
import { RETURN_REASONS } from "../types/return";

const returnSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    merchant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: RETURN_REASONS,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    refundUpiId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
    refundStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    refundProofImage: {
      type: String,
      trim: true,
    },
    returnDelivery: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
    },
  },
  { timestamps: true }
);

returnSchema.index({ order: 1 }, { unique: true });
returnSchema.index({ merchant: 1, status: 1 });
returnSchema.index({ customer: 1, status: 1 });

const ReturnModel = mongoose.model<IReturn>("Return", returnSchema);

export default ReturnModel;
