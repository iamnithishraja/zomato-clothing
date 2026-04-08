export default function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[240px] flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-stone-200 border-t-amber-600"
        aria-hidden
      />
      <p className="text-sm font-medium text-stone-600">{label}</p>
    </div>
  );
}
