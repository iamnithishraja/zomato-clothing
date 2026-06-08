export interface OrderStoreReviewFields {
  status?: string;
  storeRated?: boolean;
  storeRating?: number | null;
  storeReview?: string | null;
  storeRatedAt?: string | Date | null;
}

export function formatStoreRatingAverage(average?: number | null): string {
  if (average == null || average <= 0) return '—';
  return Number(average).toFixed(1);
}

export function formatStoreReviewCount(count?: number | null): string {
  const n = count ?? 0;
  if (n <= 0) return 'No reviews yet';
  if (n === 1) return '1 review';
  return `${n} reviews`;
}

export function hasStoreReviews(count?: number | null): boolean {
  return (count ?? 0) > 0;
}

export function hasOrderStoreReview(order: OrderStoreReviewFields): boolean {
  return (
    order.storeRated === true &&
    order.storeRating != null &&
    order.storeRating >= 1 &&
    order.storeRating <= 5
  );
}

export function renderStarRating(rating?: number | null): string {
  if (rating == null || Number.isNaN(rating)) return '—';
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export function formatReviewDate(
  value?: string | Date | null,
  style: 'date' | 'datetime' = 'date',
): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  if (style === 'datetime') {
    return d.toLocaleString('en-IN');
  }
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
