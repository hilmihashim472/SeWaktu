import MasjidCard from "./MasjidCard";
import { useLanguage } from "../../contexts/LanguageContext";

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col gap-3 rounded-xl border border-line bg-tint p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 w-3/5 rounded bg-tint-strong" />
            <div className="h-4 w-12 rounded-full bg-tint-strong" />
          </div>
          <div className="h-3 w-2/5 rounded bg-tint-strong" />
          <div className="h-3 w-1/3 rounded bg-tint-strong" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-line bg-tint py-16 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-accent"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.4 20.5h17.2a1.5 1.5 0 0 0 1.3-2.46L13.71 3.86a1.5 1.5 0 0 0-2.42 0z"
        />
      </svg>
      <div>
        <p className="font-serif text-lg text-ink-200">{t("masjidList.errorTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-400">{t("masjidList.errorBody")}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

function EmptyState({ onClearFilters }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-line bg-tint py-16 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-ink-500"
        aria-hidden="true"
      >
        <circle cx="10.5" cy="10.5" r="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-4.8-4.8M8 10.5h5" />
      </svg>
      <p className="font-serif text-lg text-ink-200">{t("masjidList.emptyTitle")}</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("masjidList.clearFilters")}
      </button>
    </div>
  );
}

export default function MasjidList({ results, loading, error, onRetry, onSelect, onClearFilters }) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState onRetry={onRetry} />;
  if (results.length === 0) return <EmptyState onClearFilters={onClearFilters} />;

  return (
    <div className="grid grid-cols-1 gap-4 animate-fade-in-up sm:grid-cols-2 lg:grid-cols-3">
      {results.map((masjid) => (
        <MasjidCard key={masjid.id} masjid={masjid} onSelect={onSelect} />
      ))}
    </div>
  );
}
