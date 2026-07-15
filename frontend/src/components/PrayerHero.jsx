import PrayerIcon from "./PrayerIcon";
import { PRAYER_LABELS } from "./PrayerGrid";
import { useLanguage } from "../contexts/LanguageContext";

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function PrayerHero({ timings, next, secondsRemaining, progress, zoneName, onChangeZone }) {
  const { t } = useLanguage();
  if (!next) return null;

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      {zoneName && (
        <div className="mb-1 flex items-center justify-center gap-1.5 px-6">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-positive">
            {zoneName}
          </p>
          <button
            type="button"
            onClick={onChangeZone}
            aria-label={t("prayerHero.changeZone")}
            className="text-positive transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="relative flex h-52 w-52 sm:h-60 sm:w-60 items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={RADIUS} strokeWidth="4" stroke="var(--line)" fill="none" />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            strokeWidth="4"
            stroke="var(--accent)"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div className="flex flex-col items-center px-4 text-center">
          <PrayerIcon name={next} className="mb-1 h-7 w-7 text-accent" />
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400">{t("prayerHero.next")}</p>
          <h2 className="font-serif text-3xl leading-tight text-accent-strong sm:text-4xl">
            {PRAYER_LABELS[next]}
          </h2>
          <p className="font-mono text-sm text-ink-300">{timings[next]}</p>
        </div>
      </div>

      <p
        className="mt-3 font-mono text-4xl text-accent tabular-nums sm:text-5xl"
        aria-live="polite"
      >
        {formatCountdown(secondsRemaining)}
      </p>
    </div>
  );
}
