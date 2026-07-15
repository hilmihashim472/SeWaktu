import PrayerIcon from "./PrayerIcon";
import { useLanguage } from "../contexts/LanguageContext";

export const PRAYER_LABELS = {
  imsak: "Imsak",
  fajr: "Subuh",
  syuruk: "Syuruk",
  dhuhr: "Zohor",
  asr: "Asar",
  maghrib: "Maghrib",
  isha: "Isyak",
};

export default function PrayerGrid({ timings, next, current }) {
  const { t } = useLanguage();
  const entries = Object.entries(PRAYER_LABELS);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {entries.map(([key, label], index) => {
        const isNext = key === next;
        const isCurrent = key === current;
        const isLast = index === entries.length - 1;
        return (
          <div
            key={key}
            className={`group relative overflow-hidden rounded-xl border p-4 text-center backdrop-blur-sm transition-all duration-300 ${
              isLast ? "col-span-2 sm:col-span-3 lg:col-span-1" : ""
            } ${
              isNext
                ? "border-brass bg-brass/10 shadow-[0_0_24px_-6px_rgba(196,147,63,0.7)] scale-[1.03]"
                : "border-line bg-tint hover:border-line-strong hover:bg-tint-strong"
            }`}
          >
            {isCurrent && !isNext && (
              <span className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400/60" aria-hidden="true" />
            )}
            <PrayerIcon
              name={key}
              className={`mx-auto h-6 w-6 ${isNext ? "text-accent" : "text-ink-400"}`}
            />
            <p
              className={`mt-2 font-serif text-sm sm:text-base ${
                isNext ? "text-accent-strong" : "text-ink-300"
              }`}
            >
              {label}
            </p>
            <p
              className={`mt-1 font-mono text-lg sm:text-xl tabular-nums ${
                isNext ? "text-accent" : "text-ink-100"
              }`}
            >
              {timings[key]}
            </p>
            {isCurrent && !isNext && (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-positive">
                {t("prayerGrid.now")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
