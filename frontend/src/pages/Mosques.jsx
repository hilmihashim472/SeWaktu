import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import MosqueFilters from "../components/mosques/MosqueFilters";
import NearbySearch from "../components/mosques/NearbySearch";
import ContributeModal from "../components/mosques/ContributeModal";
import MosqueMap from "../components/mosques/MosqueMap";
import MosqueCard from "../components/mosques/MosqueCard";
import Pagination from "../components/mosques/Pagination";
import useMosqueSearch from "../hooks/useMosqueSearch";
import { useLanguage } from "../contexts/LanguageContext";

const PAGE_SIZE = 50;

function ErrorState({ onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-line bg-tint py-16 text-center">
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
        <p className="font-serif text-lg text-ink-200">{t("mosques.errorTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-400">{t("mosques.errorBody")}</p>
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

export default function Mosques() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ search: "", state: "", district: "", type: "" });
  const [nearby, setNearby] = useState(null);
  const [radius, setRadius] = useState(5);
  const [page, setPage] = useState(1);
  const [showContribute, setShowContribute] = useState(false);

  const updateFilters = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };
  const handleLocate = (coords) => {
    setNearby(coords);
    setPage(1);
  };
  const handleClearNearby = () => {
    setNearby(null);
    setPage(1);
  };
  const handleRadiusChange = (km) => {
    setRadius(km);
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({ search: "", state: "", district: "", type: "" });
    setNearby(null);
    setPage(1);
  };

  const { results, total, loading, error, retry } = useMosqueSearch({
    search: filters.search,
    state: filters.state,
    district: filters.district,
    type: filters.type,
    nearby,
    radius,
  });

  const handleSelect = useCallback((id) => navigate(`/mosques/${id}`), [navigate]);

  // Client-side pagination over the already-fully-fetched result set (the
  // map needs every matching marker anyway) — no second request needed just
  // to page through the same data as a card grid.
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-ink-100 sm:text-4xl">
          {t("mosques.titlePrefix")} <span className="text-accent">{t("mosques.titleAccent")}</span>
        </h1>
        <p className="mt-2 text-sm text-ink-400">{t("mosques.subtitle")}</p>
      </div>

      <MosqueFilters filters={filters} onChange={updateFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <NearbySearch
          nearby={nearby}
          radius={radius}
          onLocate={handleLocate}
          onClear={handleClearNearby}
          onRadiusChange={handleRadiusChange}
        />
        <button
          type="button"
          onClick={() => setShowContribute(true)}
          className="flex items-center gap-2 rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          {t("mosques.contribute")}
        </button>
      </div>

      {showContribute && <ContributeModal onClose={() => setShowContribute(false)} />}

      {!loading && !error && (
        <p className="font-mono text-sm text-ink-400">
          {t("mosques.resultCount", { count: total.toLocaleString() })}
        </p>
      )}

      {error && <ErrorState onRetry={retry} />}

      {!error && (
        <div className="relative z-0 h-[42vh] min-h-[280px] w-full overflow-hidden rounded-xl border border-line sm:h-[60vh] sm:min-h-[420px]">
          {loading && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-overlay backdrop-blur-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-8 w-8 animate-spin text-accent"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9" />
              </svg>
            </div>
          )}
          <MosqueMap
            mosques={results}
            userLocation={nearby}
            onSelect={handleSelect}
            className="h-full w-full"
          />
        </div>
      )}

      {!error && loading && <ListSkeleton />}
      {!error && !loading && results.length === 0 && <EmptyState onClearFilters={clearFilters} />}
      {!error && !loading && results.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 animate-fade-in-up sm:grid-cols-2 lg:grid-cols-3">
            {pagedResults.map((mosque) => (
              <MosqueCard key={mosque.id} mosque={mosque} onSelect={handleSelect} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={results.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <p className="mt-2 text-center text-xs text-ink-500">{t("mosques.attribution")}</p>
    </div>
  );
}
