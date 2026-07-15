import { useEffect } from "react";
import ZoneSelector from "./ZoneSelector";
import useNearestZone from "../hooks/useNearestZone";
import { useLanguage } from "../contexts/LanguageContext";

export default function ZoneSelectorModal({ zone, onChange, onClose }) {
  const { t } = useLanguage();
  const { detect, loading, error } = useNearestZone();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleUseLocation = async () => {
    const result = await detect();
    if (result) onChange(result.zone);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("zoneSelectorModal.title")}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-line bg-surface-mid p-6 shadow-2xl animate-fade-in-up"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-lg text-ink-100">{t("zoneSelectorModal.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-md p-1 text-ink-400 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={handleUseLocation}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-tint px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-brass/40 hover:text-accent-strong disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2v3M12 19v3M2 12h3M19 12h3"
                />
              </>
            )}
          </svg>
          {loading ? t("zoneSelectorModal.detecting") : t("zoneSelectorModal.useLocation")}
        </button>
        {error && (
          <p className="mt-2 text-center text-xs text-negative">
            {error.code ? t(`errors.${error.code}`) : error.message}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-ink-600">
          <span className="h-px flex-1 bg-tint-strong" aria-hidden="true" />
          {t("zoneSelectorModal.orChooseManually")}
          <span className="h-px flex-1 bg-tint-strong" aria-hidden="true" />
        </div>

        <div className="mt-4">
          <ZoneSelector zone={zone} onChange={onChange} stacked />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {t("common.done")}
        </button>
      </div>
    </div>
  );
}
