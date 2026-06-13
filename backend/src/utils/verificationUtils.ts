import type { VerificationStatus } from '../types/verification';

type UserLike = {
  role?: string;
  isProfileComplete?: boolean;
  verificationStatus?: VerificationStatus;
};

/** Resolve effective verification status (grandfathers existing merchants/delivery partners). */
export function resolveVerificationStatus(user: UserLike): VerificationStatus {
  if (user.verificationStatus) {
    return user.verificationStatus;
  }
  if (user.role === 'User') {
    return 'not_required';
  }
  if (user.role === 'Merchant' || user.role === 'Delivery') {
    return user.isProfileComplete ? 'approved' : 'pending_documents';
  }
  return 'not_required';
}

export function requiresVerification(user: UserLike): boolean {
  const status = resolveVerificationStatus(user);
  return user.role === 'Merchant' || user.role === 'Delivery'
    ? status !== 'not_required' && status !== 'approved'
    : false;
}

export function isVerificationApproved(user: UserLike): boolean {
  const status = resolveVerificationStatus(user);
  if (user.role === 'User') return true;
  return status === 'approved' || status === 'not_required';
}

export function verificationFieldsForClient(user: any) {
  const verificationStatus = resolveVerificationStatus(user);
  return {
    verificationStatus,
    verificationDocuments: user.verificationDocuments || [],
    verificationSubmittedAt: user.verificationSubmittedAt ?? null,
    verificationReviewedAt: user.verificationReviewedAt ?? null,
    verificationReviewNote: user.verificationReviewNote ?? null,
  };
}
