import type { VerificationDocument, VerificationStatus } from '@/types/verification';

export type UserRole = 'User' | 'Merchant' | 'Delivery';
export type UserGender = 'Male' | 'Female' | 'Other';

export interface User {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  gender?: UserGender;
  avatar?: string;
  addresses?: string[];
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  verificationStatus?: VerificationStatus;
  verificationGrandfathered?: boolean;
  verificationDocuments?: VerificationDocument[];
  verificationSubmittedAt?: string | null;
  verificationReviewedAt?: string | null;
  verificationReviewNote?: string | null;
  role: UserRole;
  isBusy?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
