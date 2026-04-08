import { cn } from '@/lib/utils';

export default function PanelCard({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const hasHeader = Boolean(title || description || action);
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm shadow-stone-200/40',
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-stone-500">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(padded && 'p-4 sm:p-6')}>{children}</div>
    </section>
  );
}
