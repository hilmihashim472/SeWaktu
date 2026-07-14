const buttonClasses =
  "flex items-center gap-1 rounded-lg border border-white/15 bg-night-mid/80 px-3 py-1.5 text-sm text-slate-200 " +
  "transition-colors hover:border-brass/40 hover:text-brass-light disabled:pointer-events-none disabled:opacity-40 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="font-mono text-xs text-slate-500">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClasses}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Prev
        </button>

        <span className="font-mono text-xs text-slate-400">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          className={buttonClasses}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
