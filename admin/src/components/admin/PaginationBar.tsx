import { cn } from '@/lib/utils';

export default function PaginationBar({
  page,
  totalPages,
  totalLabel,
  onPrev,
  onNext,
  disabledPrev,
  disabledNext,
  className,
}: {
  page: number;
  totalPages: number;
  totalLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  disabledPrev: boolean;
  disabledNext: boolean;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 border-t border-stone-100 px-4 py-4 sm:flex-row sm:gap-4',
        className,
      )}
    >
      <button
        type="button"
        disabled={disabledPrev}
        onClick={onPrev}
        className={cn(
          'rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-800 transition-colors',
          disabledPrev
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
        )}
      >
        Previous
      </button>
      <p className="order-first text-center text-xs text-stone-600 sm:order-none">
        Page <span className="font-semibold text-stone-900">{page}</span> of{' '}
        <span className="font-semibold text-stone-900">{totalPages}</span>
        {totalLabel ? (
          <>
            {' '}
            <span className="text-stone-500">({totalLabel})</span>
          </>
        ) : null}
      </p>
      <button
        type="button"
        disabled={disabledNext}
        onClick={onNext}
        className={cn(
          'rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-800 transition-colors',
          disabledNext
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
        )}
      >
        Next
      </button>
    </div>
  );
}
