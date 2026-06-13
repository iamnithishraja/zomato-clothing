import type { User } from '@/types/user';
import { needsVerificationScreen } from '@/utils/verificationUtils';

/** Single source of truth for post-login / post-profile navigation. */
export function getPostAuthRoute(user: User | null | undefined): string {
  if (!user) return '/auth/Auth';

  if (!user.isProfileComplete) {
    if (user.role === 'Merchant' && user.name) {
      return '/auth/StoreDetails';
    }
    return '/auth/ProfileCompletion';
  }

  if (needsVerificationScreen(user)) {
    return '/auth/VerificationPending';
  }

  switch (user.role) {
    case 'Merchant':
      return '/(merchantTabs)/';
    case 'Delivery':
      return '/(deliveryTabs)/';
    default:
      return '/(tabs)';
  }
}

export function navigateAfterAuth(user: User, router: { replace: (path: any) => void }): void {
  router.replace(getPostAuthRoute(user));
}
