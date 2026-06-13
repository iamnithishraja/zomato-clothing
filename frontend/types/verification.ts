export type VerificationStatus =
  | 'not_required'
  | 'pending_documents'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type VerificationDocumentType = 'aadhaar' | 'other';

export interface VerificationDocument {
  documentType: VerificationDocumentType;
  url: string;
  fileName?: string;
  uploadedAt?: string;
}
