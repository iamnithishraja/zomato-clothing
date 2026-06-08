import { cn } from '@/lib/utils';
import {
  hasOrderStoreReview,
  type OrderStoreReviewFields,
  renderStarRating,
} from '@/lib/store-rating';

type Props = {
  order: OrderStoreReviewFields;
  className?: string;
};

/** Compact store-review status for order tables. */
export default function StoreReviewCell({ order, className }: Props) {
  if (hasOrderStoreReview(order)) {
    return (
      <span className={cn('font-semibold text-amber-800', className)}>
        {renderStarRating(order.storeRating)} ({order.storeRating}/5)
      </span>
    );
  }

  if (order.status === 'Delivered') {
    return <span className={cn('text-stone-400', className)}>Pending</span>;
  }

  return <span className={cn('text-stone-400', className)}>—</span>;
}
