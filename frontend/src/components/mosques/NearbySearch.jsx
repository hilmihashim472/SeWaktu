import { useLanguage } from "../../contexts/LanguageContext";
import useNearbySearch from "../../hooks/useNearbySearch";

const RADIUS_OPTIONS_KM = [1, 5, 10, 20];

export default function NearbySearch({ nearby, radius, onLocate, onClear, onRadiusChange }) {
  const { t } = useLanguage();
  const { locate, loading, error } = useNearbySearch();

  const handleClick = async () => {
    if (nearby) {
      onClear();
      return;
    }
    const coords = await locate();
    if (coords) onLocate(coords);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-line bg-tint px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-brass/40 hover:text-accent-strong disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          aria-hidden="true"
        >
          {loading ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9" />
          ) : (
            <>
              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </>
          )}
        </svg>
        {loading ? t("mosques.locating") : nearby ? t("mosques.clearNearby") : t("mosques.useLocation")}
      </button>

      {nearby && (
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-control p-1">
          {RADIUS_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                radius === km ? "bg-brass/20 text-accent-strong" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-negative">{t(`errors.${error.code}`)}</p>}
    </div>
  );
}
