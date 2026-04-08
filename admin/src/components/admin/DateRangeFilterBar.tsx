import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  /** e.g. 7 = last 7 calendar days ending today */
  onPresetDays: (days: number) => void;
  className?: string;
  disabled?: boolean;
};

export default function DateRangeFilterBar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
  onPresetDays,
  className,
  disabled,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm shadow-stone-200/40',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
        <CalendarRange className="h-4 w-4 text-amber-700" aria-hidden />
        Date range
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="admin-df" className="text-xs font-semibold text-stone-600">
              From
            </label>
            <input
              id="admin-df"
              type="date"
              value={dateFrom}
              onChange={e => onDateFromChange(e.target.value)}
              disabled={disabled}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="admin-dt" className="text-xs font-semibold text-stone-600">
              To
            </label>
            <input
              id="admin-dt"
              type="date"
              value={dateTo}
              onChange={e => onDateToChange(e.target.value)}
              disabled={disabled}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPresetDays(7)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Last 7 days
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPresetDays(30)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Last 30 days
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onApply}
            className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-stone-900 shadow-sm hover:bg-amber-500 disabled:opacity-50"
          >
            Apply range
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            Clear dates
          </button>
        </div>
      </div>
    </div>
  );
}
