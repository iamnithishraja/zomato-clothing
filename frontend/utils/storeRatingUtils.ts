import type { StoreRating } from '@/types/store';

export function normalizeStoreRating(rating?: Partial<StoreRating> | null): StoreRating {
  return {
    average: Number(rating?.average) || 0,
    totalReviews: Number(rating?.totalReviews) || 0,
  };
}

export function formatStoreRatingAverage(average: number): string {
  if (!average || average <= 0) return '0.0';
  return average.toFixed(1);
}

export function formatStoreReviewCount(count: number): string {
  if (count <= 0) return 'No reviews yet';
  if (count === 1) return '1 review';
  return `${count} reviews`;
}

export function hasStoreReviews(rating?: Partial<StoreRating> | null): boolean {
  return (rating?.totalReviews ?? 0) > 0;
}
