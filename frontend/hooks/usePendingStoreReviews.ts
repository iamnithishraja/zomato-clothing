import { usePendingStoreReviewsContext } from '@/contexts/PendingStoreReviewsContext';

/** @deprecated Prefer usePendingStoreReviewsContext inside customer tabs */
export function usePendingStoreReviews(_autoFetch = true) {
  return usePendingStoreReviewsContext();
}
