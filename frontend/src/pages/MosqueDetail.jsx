import { Link, useParams } from "react-router-dom";
import useMosqueDetail from "../hooks/useMosqueDetail";
import MosqueMap from "../components/mosques/MosqueMap";
import { useLanguage } from "../contexts/LanguageContext";
import usePageMeta from "../hooks/usePageMeta";

function DetailRow({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-t border-line py-2 first:border-t-0 first:pt-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">{label}</span>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="break-words text-sm text-accent-strong underline decoration-brass/40 underline-offset-2 hover:text-accent"
        >
          {value}
        </a>
      ) : (
        <span className="break-words text-sm text-ink-200">{value}</span>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-7 w-2/3 rounded bg-tint-strong" />
      <div className="h-4 w-1/3 rounded bg-tint-strong" />
      <div className="h-48 rounded bg-tint-strong" />
    </div>
  );
}

function ErrorState() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-ink-300">{t("mosques.detailErrorBody")}</p>
      <Link
        to="/mosques"
        className="text-sm text-accent-strong underline decoration-brass/40 underline-offset-2 hover:text-accent"
      >
        {t("mosques.backToMap")}
      </Link>
    </div>
  );
}

export default function MosqueDetail() {
  const { id } = useParams();
  const { mosque, loading, error } = useMosqueDetail(id);
  const { t } = useLanguage();
  usePageMeta({
    title: mosque?.name || t("seo.mosquesTitle"),
    description: mosque ? t("seo.mosqueDescription", { name: mosque.name }) : t("seo.mosquesDescription"),
  });

  const googleMapsUrl = mosque
    ? `https://www.google.com/maps/search/?api=1&query=${mosque.latitude},${mosque.longitude}`
    : null;

  // Most live rows now come from the geocoded SISMIM/JAIS import, not OSM —
  // shown per-record rather than a single hardcoded "OpenStreetMap" credit.
  const sourceLabel =
    mosque?.source === "jais"
      ? t("masjidDetailModal.sourceJais")
      : mosque?.source === "osm"
      ? t("mosques.sourceOsm")
      : t("masjidDetailModal.sourceJakim");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <Link
        to="/mosques"
        className="flex w-fit items-center gap-1 text-sm text-ink-400 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("mosques.backToMap")}
      </Link>

      {loading && <Skeleton />}
      {!loading && (error || !mosque) && <ErrorState />}

      {!loading && !error && mosque && (
        <div className="flex flex-col gap-4 animate-fade-in-up">
          <div>
            <h1 className="font-serif text-2xl leading-tight text-ink-100 sm:text-3xl">
              {mosque.name || t("mosques.unnamed")}
            </h1>
            <span className="mt-2 inline-block rounded-full border border-brass/30 bg-brass/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
              {mosque.type}
            </span>
          </div>

          <div className="relative z-0 h-56 w-full overflow-hidden rounded-xl border border-line">
            <MosqueMap mosques={[mosque]} userLocation={null} onSelect={() => {}} className="h-full w-full" />
          </div>

          <div className="rounded-xl border border-line bg-tint p-4">
            <DetailRow label={t("masjidDetailModal.address")} value={mosque.address} />
            <DetailRow label={t("masjidFilters.state")} value={mosque.state} />
            <DetailRow label={t("masjidFilters.district")} value={mosque.district} />
            <DetailRow label={t("mosques.city")} value={mosque.city} />
            <DetailRow
              label={t("mosques.coordinates")}
              value={`${mosque.latitude.toFixed(6)}, ${mosque.longitude.toFixed(6)}`}
            />
            <DetailRow
              label={t("masjidDetailModal.phone")}
              value={mosque.phone}
              href={mosque.phone ? `tel:${mosque.phone}` : undefined}
            />
            <DetailRow label={t("masjidDetailModal.website")} value={mosque.website} href={mosque.website} />
            <DetailRow label={t("mosques.operator")} value={mosque.operator} />
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-brass/60 bg-brass/10 px-4 py-2.5 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            {t("mosques.openInGoogleMaps")}
          </a>

          <p className="text-center text-[10px] uppercase tracking-wider text-ink-600">{sourceLabel}</p>
        </div>
      )}
    </div>
  );
}
