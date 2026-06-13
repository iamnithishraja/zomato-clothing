import type { VerificationStatus } from '@/types/verification';

type UserLike = {
  role?: 'User' | 'Merchant' | 'Delivery';
  isProfileComplete?: boolean;
  verificationStatus?: VerificationStatus;
};

export function resolveVerificationStatus(user: UserLike): VerificationStatus {
  if (user.verificationStatus) {
    return user.verificationStatus;
  }
  if (user.role === 'User') return 'not_required';
  if (user.role === 'Merchant' || user.role === 'Delivery') {
    return user.isProfileComplete ? 'approved' : 'pending_documents';
  }
  return 'not_required';
}

/** True when merchant/delivery must stay on the verification gate screen. */
export function needsVerificationScreen(user: UserLike | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== 'Merchant' && user.role !== 'Delivery') return false;
  if (!user.isProfileComplete) return false;
  const status = resolveVerificationStatus(user);
  return status !== 'approved' && status !== 'not_required';
}

export function isVerificationApproved(user: UserLike | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'User') return true;
  const status = resolveVerificationStatus(user);
  return status === 'approved' || status === 'not_required';
}

export function verificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'pending_documents':
      return 'Documents required';
    case 'pending_review':
      return 'Under review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Not required';
  }
}
