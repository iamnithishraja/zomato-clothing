import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm shadow-stone-200/40 transition-shadow hover:shadow-md hover:shadow-stone-200/60">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </p>
          {hint ? <p className="mt-1 text-xs text-stone-600">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
