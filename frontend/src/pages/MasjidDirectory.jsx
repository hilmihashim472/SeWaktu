import { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MasjidFilters from "../components/masjid/MasjidFilters";
import MasjidList from "../components/masjid/MasjidList";
import Pagination from "../components/masjid/Pagination";
import MasjidDetailModal from "../components/masjid/MasjidDetailModal";
import useMasjidSearch from "../hooks/useMasjidSearch";
import { useLanguage } from "../contexts/LanguageContext";

const LIMIT = 50;

export default function MasjidDirectory() {
  const { t } = useLanguage();
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

  const kindLabelKey = filters.kind === "masjid" ? "kindMasjid" : filters.kind === "surau" ? "kindSurau" : "kindAll";
  const summary =
    !loading && !error
      ? `${total.toLocaleString()} ${t(`masjidDirectory.${kindLabelKey}`)}${
          filters.state ? t("masjidDirectory.summaryInState", { state: filters.state }) : ""
        }`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-ink-100 sm:text-4xl">
          {t("masjidDirectory.titlePrefix")} <span className="text-accent">{t("masjidDirectory.titleAccent")}</span>
        </h1>
        <p className="mt-2 text-sm text-ink-400">{t("masjidDirectory.subtitle")}</p>
      </div>

      <MasjidFilters filters={filters} onChange={updateFilters} />

      {summary && <p className="font-mono text-sm text-ink-400">{summary}</p>}

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

      <p className="mt-4 text-center text-xs text-ink-500">
        {t("masjidDirectory.attribution")}{" "}
        <a
          href="https://github.com/abualif120/malaysia-masjid-dataset"
          target="_blank"
          rel="noreferrer"
          className="text-accent-strong underline decoration-brass/40 underline-offset-2 hover:text-accent"
        >
          {t("masjidDirectory.attributionLinkLabel")}
        </a>{" "}
        {t("masjidDirectory.attributionSuffix")}
      </p>

      {id && <MasjidDetailModal id={id} onClose={closeModal} />}
    </div>
  );
}
