export function formatViewCount(count: number): string {
  return new Intl.NumberFormat('tr-TR').format(Math.max(0, count));
}

export default function ViewCount({
  count,
  className = '',
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`${formatViewCount(count)} görüntülenme`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
      >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
      <span>{formatViewCount(count)} görüntülenme</span>
    </span>
  );
}
