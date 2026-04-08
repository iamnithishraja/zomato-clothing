export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="py-14 text-center">
      <p className="text-sm font-medium text-stone-800">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-stone-500 sm:text-sm">{description}</p>
      ) : null}
    </div>
  );
}
