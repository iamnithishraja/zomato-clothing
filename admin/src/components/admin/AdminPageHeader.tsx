import { cn } from '@/lib/utils';

export default function AdminPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1
          className={cn(
            "mt-1 font-['Fraunces',ui-serif,Georgia,serif] text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}
