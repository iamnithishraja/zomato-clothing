import { cn } from '@/lib/utils';

type LocalsLogoProps = {
  size?: number;
  className?: string;
  /** e.g. "Admin" — logo image already includes the Locals wordmark */
  subtitle?: string;
  variant?: 'light' | 'dark';
};

export default function LocalsLogo({
  size = 40,
  className,
  subtitle,
  variant = 'dark',
}: LocalsLogoProps) {
  const subtitleClass = variant === 'light' ? 'text-amber-100/90' : 'text-stone-500';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl shadow-md shadow-amber-500/20"
        style={{ width: size, height: size }}
      >
        <img
          src="/locals-logo.png"
          alt="Locals"
          className="block h-full w-full object-contain"
          width={size}
          height={size}
          draggable={false}
        />
      </div>
      {subtitle ? (
        <p className={cn('text-[10px] font-bold uppercase tracking-[0.14em]', subtitleClass)}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
