import { useLanguage } from "../../contexts/LanguageContext";

const TYPE_STYLES = {
  Masjid: "bg-brass/15 text-accent-strong border-brass/30",
  Surau: "bg-emerald-500/15 text-positive border-emerald-500/30",
  Mosque: "bg-tint-strong text-ink-300 border-line",
};

export default function MosqueCard({ mosque, onSelect }) {
  const { t } = useLanguage();

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(mosque.id);
    }
  };

  const location = [mosque.district, mosque.state].filter(Boolean).join(", ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(mosque.id)}
      onKeyDown={handleKeyDown}
      className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-line bg-tint p-4 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brass/40 hover:bg-tint-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base leading-snug text-ink-100 group-hover:text-accent-strong">
          {mosque.name || t("mosques.unnamed")}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLES[mosque.type] ?? TYPE_STYLES.Mosque}`}
        >
          {mosque.type}
        </span>
      </div>

      {location && <p className="text-sm text-ink-400">{location}</p>}

      {typeof mosque.distance_km === "number" && (
        <p className="font-mono text-xs text-positive">{mosque.distance_km.toFixed(1)} km</p>
      )}

      {mosque.phone && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <a
            href={`tel:${mosque.phone}`}
            onClick={(event) => event.stopPropagation()}
            className="ml-auto flex items-center gap-1 font-mono text-xs text-ink-400 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 5c0-.6.4-1 1-1h2.2c.5 0 .9.3 1 .8l.8 3.1c.1.4 0 .9-.4 1.2L7 10.5a12 12 0 0 0 6.5 6.5l1.4-1.6c.3-.3.8-.5 1.2-.4l3.1.8c.5.1.8.5.8 1V19c0 .6-.4 1-1 1h-1.5C9.4 20 4 14.6 4 8V5z"
              />
            </svg>
            {mosque.phone}
          </a>
        </div>
      )}
    </div>
  );
}
