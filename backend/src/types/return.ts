import mongoose, { type Document } from "mongoose";

export type ReturnStatus = "Pending" | "Approved" | "Rejected" | "Completed";
export type RefundStatus = "Pending" | "Completed";

export const RETURN_REASONS = [
  "Wrong Item Received",
  "Damaged Item",
  "Size Issue",
  "Quality Issue",
  "Other",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

export interface IReturn extends Document {
  order: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  merchant: mongoose.Types.ObjectId;
  reason: ReturnReason;
  notes?: string;
  refundUpiId?: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  refundProofImage?: string;
  returnDelivery?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
