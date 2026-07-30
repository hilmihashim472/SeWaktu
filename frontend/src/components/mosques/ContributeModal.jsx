import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import useMosqueSubmission from "../../hooks/useMosqueSubmission";
import useNearbySearch from "../../hooks/useNearbySearch";

const inputClasses =
  "w-full appearance-none rounded-lg border border-line bg-surface-control py-2 pl-3 pr-3 text-sm text-ink-100 " +
  "placeholder:text-ink-500 transition-colors hover:border-line-strong focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">{label}</span>
      {children}
    </label>
  );
}

const TYPE_OPTIONS = [
  { value: "Masjid", labelKey: "masjid" },
  { value: "Surau", labelKey: "surau" },
];

export default function ContributeModal({ onClose }) {
  const { t } = useLanguage();
  const { resolveLocation, resolving, resolveError, submit, submitting, submitError } =
    useMosqueSubmission();
  const { locate, loading: locating, error: locateError } = useNearbySearch();

  const [name, setName] = useState("");
  const [type, setType] = useState("Masjid");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDetectLocation = async () => {
    if (!mapsUrl.trim()) return;
    const result = await resolveLocation(mapsUrl.trim());
    if (result) setCoords(result);
  };

  const handleUseLocation = async () => {
    const result = await locate();
    if (result) setCoords(result);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !coords) return;

    const result = await submit({
      name: name.trim(),
      type,
      address: address.trim() || undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
      mapsUrl: mapsUrl.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (result) setSuccess(true);
  };

  const canSubmit = name.trim().length > 0 && coords !== null && !submitting;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("mosques.contributeTitle")}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-line bg-surface-mid p-6 shadow-2xl animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-lg text-ink-100">{t("mosques.contributeTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 rounded-md p-1 text-ink-400 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 text-positive" aria-hidden="true">
              <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.5 2.5 5-5" />
            </svg>
            <p className="font-serif text-lg text-ink-100">{t("mosques.contributeSuccessTitle")}</p>
            <p className="text-sm text-ink-400">{t("mosques.contributeSuccessBody")}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {t("mosques.contributeDone")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-ink-400">{t("mosques.contributeIntro")}</p>

            <Field label={t("mosques.contributeName")}>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("mosques.contributeNamePlaceholder")}
                className={inputClasses}
              />
            </Field>

            <Field label={t("masjidFilters.type")}>
              <div className="flex rounded-lg border border-line bg-surface-control p-1">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                      type === opt.value ? "bg-brass/20 text-accent-strong" : "text-ink-400 hover:text-ink-200"
                    }`}
                  >
                    {t(`masjidFilters.${opt.labelKey}`)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={t("mosques.contributeAddress")}>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClasses}
              />
            </Field>

            <Field label={t("mosques.contributeMapsUrl")}>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder={t("mosques.contributeMapsUrlPlaceholder")}
                  className={inputClasses}
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={!mapsUrl.trim() || resolving}
                  className="shrink-0 rounded-lg border border-line bg-tint px-3 py-2 text-xs font-medium text-ink-200 transition-colors hover:border-brass/40 hover:text-accent-strong disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
                >
                  {resolving ? "…" : t("mosques.contributeDetectLocation")}
                </button>
              </div>
            </Field>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-ink-600">
              <span className="h-px flex-1 bg-tint-strong" aria-hidden="true" />
              {t("mosques.contributeOr")}
              <span className="h-px flex-1 bg-tint-strong" aria-hidden="true" />
            </div>

            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="flex items-center justify-center gap-2 rounded-lg border border-line bg-tint px-4 py-2 text-sm font-medium text-ink-200 transition-colors hover:border-brass/40 hover:text-accent-strong disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`h-4 w-4 ${locating ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                {locating ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </>
                )}
              </svg>
              {t("mosques.contributeUseLocation")}
            </button>

            {coords && (
              <p className="text-center text-xs text-positive">
                {t("mosques.contributeLocationSet", {
                  lat: coords.latitude.toFixed(5),
                  lng: coords.longitude.toFixed(5),
                })}
              </p>
            )}
            {!coords && (resolveError || locateError) && (
              <p className="text-center text-xs text-negative">
                {resolveError?.message || t(`errors.${locateError?.code}`)}
              </p>
            )}

            <Field label={t("masjidDetailModal.phone")}>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
            </Field>

            <Field label={t("masjidDetailModal.website")}>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClasses} />
            </Field>

            <Field label={t("mosques.contributeNotes")}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("mosques.contributeNotesPlaceholder")}
                rows={2}
                className={`${inputClasses} resize-none`}
              />
            </Field>

            {submitError && <p className="text-center text-xs text-negative">{submitError.message}</p>}
            {!coords && name.trim() && (
              <p className="text-center text-xs text-ink-500">{t("mosques.contributeLocationRequired")}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-1 w-full rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {submitting ? t("mosques.contributeSubmitting") : t("mosques.contributeSubmit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
