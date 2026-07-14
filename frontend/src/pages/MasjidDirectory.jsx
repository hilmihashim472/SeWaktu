import { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MasjidFilters from "../components/masjid/MasjidFilters";
import MasjidList from "../components/masjid/MasjidList";
import Pagination from "../components/masjid/Pagination";
import MasjidDetailModal from "../components/masjid/MasjidDetailModal";
import useMasjidSearch from "../hooks/useMasjidSearch";

const LIMIT = 50;
const KIND_LABELS = { masjid: "masjid", surau: "surau", "": "masjid & surau" };

export default function MasjidDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();

  const filters = useMemo(
    () => ({
      state: searchParams.get("state") ?? "",
      district: searchParams.get("district") ?? "",
      kind: searchParams.get("kind") ?? "",
      q: searchParams.get("q") ?? "",
      page: Number.parseInt(searchParams.get("page"), 10) || 1,
    }),
    [searchParams]
  );

  const { results, total, totalPages, loading, error, retry } = useMasjidSearch({
    ...filters,
    limit: LIMIT,
  });

  const updateFilters = useCallback(
    (partial) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(partial)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page"); // any filter change starts back at page 1
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = useCallback(
    (page) => {
      const next = new URLSearchParams(searchParams);
      if (page > 1) next.set("page", String(page));
      else next.delete("page");
      setSearchParams(next, { replace: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  const handleSelect = useCallback(
    (masjidId) => navigate({ pathname: `/masjid/${masjidId}`, search: searchParams.toString() }),
    [navigate, searchParams]
  );

  const closeModal = useCallback(
    () => navigate({ pathname: "/masjid", search: searchParams.toString() }),
    [navigate, searchParams]
  );

  const summary =
    !loading && !error
      ? `${total.toLocaleString()} ${KIND_LABELS[filters.kind]}${filters.state ? ` in ${filters.state}` : ""}`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-slate-100 sm:text-4xl">
          Masjid <span className="text-brass">&amp; Surau Directory</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Search masjid and surau across Malaysia, sourced from JAKIM and JAIS.
        </p>
      </div>

      <MasjidFilters filters={filters} onChange={updateFilters} />

      {summary && <p className="font-mono text-sm text-slate-400">{summary}</p>}

      <MasjidList
        results={results}
        loading={loading}
        error={error}
        onRetry={retry}
        onSelect={handleSelect}
        onClearFilters={clearFilters}
      />

      {!loading && !error && (
        <Pagination
          page={filters.page}
          totalPages={totalPages}
          total={total}
          limit={LIMIT}
          onPageChange={handlePageChange}
        />
      )}

      <p className="mt-4 text-center text-xs text-slate-500">
        Masjid &amp; surau data from SISMIM (JAKIM) and JAIS e-Masjid, compiled via the{" "}
        <a
          href="https://github.com/abualif120/malaysia-masjid-dataset"
          target="_blank"
          rel="noreferrer"
          className="text-brass-light underline decoration-brass/40 underline-offset-2 hover:text-brass"
        >
          Malaysia Masjid Dataset
        </a>{" "}
        (CC BY 4.0).
      </p>

      {id && <MasjidDetailModal id={id} onClose={closeModal} />}
    </div>
  );
}
