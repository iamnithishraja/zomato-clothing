import { cn } from '@/lib/utils';

export type SegmentOption<T extends string = string> = { value: T; label: string };

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'sm',
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap rounded-xl border border-stone-200 bg-stone-100/80 p-1',
        className,
      )}
      role="tablist"
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            value === opt.value
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
