import type { VerificationStatus } from '@/types/verification';

type UserLike = {
  role?: 'User' | 'Merchant' | 'Delivery';
  isProfileComplete?: boolean;
  verificationStatus?: VerificationStatus;
  verificationGrandfathered?: boolean;
};

function isExplicitVerificationStatus(status?: VerificationStatus): boolean {
  return (
    status === 'pending_documents' ||
    status === 'pending_review' ||
    status === 'rejected' ||
    status === 'approved'
  );
}

/** Trust API verificationStatus when admin/user set it explicitly. */
export function resolveVerificationStatus(user: UserLike): VerificationStatus {
  const raw = user.verificationStatus;

  if (isExplicitVerificationStatus(raw)) {
    return raw!;
  }

  if (user.verificationGrandfathered) {
    return 'approved';
  }

  if (user.role === 'User') {
    return 'not_required';
  }

  if (user.role !== 'Merchant' && user.role !== 'Delivery') {
    return 'not_required';
  }

  if (!raw || raw === 'not_required') {
    return user.isProfileComplete ? 'approved' : 'pending_documents';
  }

  return 'pending_documents';
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
