import { cn } from '@/lib/utils';

export default function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-0 bg-stone-50 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-10 lg:py-10',
        "font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-stone-900 antialiased",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1400px]">{children}</div>
    </div>
  );
}
