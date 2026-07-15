import { useLanguage } from "../../contexts/LanguageContext";

const buttonClasses =
  "flex items-center gap-1 rounded-lg border border-line bg-surface-control px-3 py-1.5 text-sm text-ink-200 " +
  "transition-colors hover:border-brass/40 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-40 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const { t } = useLanguage();
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="font-mono text-xs text-ink-500">
        {t("pagination.showing", { start: start.toLocaleString(), end: end.toLocaleString(), total: total.toLocaleString() })}
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
          {t("pagination.prev")}
        </button>

        <span className="font-mono text-xs text-ink-400">
          {t("pagination.page", { page, totalPages })}
        </span>

        <button
          type="button"
          className={buttonClasses}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("pagination.next")}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
