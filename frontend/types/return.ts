export type ReturnStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';
export type RefundStatus = 'Pending' | 'Completed';

export const RETURN_REASONS = [
  'Wrong Item Received',
  'Damaged Item',
  'Size Issue',
  'Quality Issue',
  'Other',
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

export interface ReturnRequest {
  _id: string;
  order: string | { _id: string; orderNumber?: string; status: string; totalAmount?: number; paymentMethod?: string; deliveryDate?: string };
  customer: string | { _id: string; name: string; phone: string };
  merchant: string;
  reason: ReturnReason;
  notes?: string;
  refundUpiId?: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  refundProofImage?: string;
  returnDelivery?: {
    _id: string;
    status: string;
    deliveryType?: string;
    deliveryPerson?: { _id: string; name: string; phone: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReturnByOrderResponse {
  success: boolean;
  message: string;
  returnRequest: ReturnRequest | null;
  canRequestReturn?: boolean;
  returnWindowExpiresAt?: string | null;
}

export interface CreateReturnPayload {
  orderId: string;
  reason: ReturnReason;
  notes?: string;
  refundUpiId?: string;
}
