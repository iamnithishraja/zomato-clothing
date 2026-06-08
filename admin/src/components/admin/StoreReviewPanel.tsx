import {
  formatReviewDate,
  hasOrderStoreReview,
  type OrderStoreReviewFields,
  renderStarRating,
} from '@/lib/store-rating';

type Props = {
  order: OrderStoreReviewFields;
};

/** Full store-review block for order detail modals. */
export default function StoreReviewPanel({ order }: Props) {
  if (order.status !== 'Delivered') {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Store review</p>
      {hasOrderStoreReview(order) ? (
        <div className="mt-2">
          <p className="text-sm font-bold tracking-wide text-amber-700">
            {renderStarRating(order.storeRating)} ({order.storeRating}/5)
          </p>
          {order.storeReview?.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
              {order.storeReview.trim()}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-stone-500">No written feedback</p>
          )}
          {order.storeRatedAt ? (
            <p className="mt-2 text-xs text-stone-500">
              Reviewed {formatReviewDate(order.storeRatedAt, 'datetime')}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-stone-600">
          Customer has not submitted a store review for this order yet.
        </p>
      )}
    </div>
  );
}
