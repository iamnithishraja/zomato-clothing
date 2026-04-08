import { AlertCircle } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50/80 px-5 py-8 text-center sm:px-8"
      role="alert"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <AlertCircle className="h-8 w-8 text-red-600" aria-hidden />
        <h2 className="text-sm font-semibold text-red-900">{title}</h2>
        <p className="text-sm text-red-800/90">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
