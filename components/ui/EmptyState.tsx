import Link from 'next/link';

interface EmptyStateProps {
  message: string;
  /** Acción opcional: texto del enlace y href */
  actionLabel?: string;
  actionHref?: string;
  /** Si no se pasa actionHref, se muestra solo el mensaje */
  className?: string;
}

export default function EmptyState({
  message,
  actionLabel,
  actionHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-600 ${className}`}
    >
      <p className="text-sm">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sanmartin-red hover:underline"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
