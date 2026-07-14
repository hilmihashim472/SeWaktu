import PrayerIcon from "./PrayerIcon";
import { PRAYER_LABELS } from "./PrayerGrid";

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function PrayerHero({ timings, next, secondsRemaining, progress, zoneName }) {
  if (!next) return null;

  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      {zoneName && (
        <p className="mb-1 px-6 text-center text-xs uppercase tracking-[0.2em] text-emerald-400/70">
          {zoneName}
        </p>
      )}

      <div className="relative flex h-52 w-52 sm:h-60 sm:w-60 items-center justify-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="100" cy="100" r={RADIUS} strokeWidth="4" stroke="rgba(255,255,255,0.08)" fill="none" />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            strokeWidth="4"
            stroke="#C4933F"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div className="flex flex-col items-center px-4 text-center">
          <PrayerIcon name={next} className="mb-1 h-7 w-7 text-brass" />
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next</p>
          <h2 className="font-serif text-3xl leading-tight text-brass-light sm:text-4xl">
            {PRAYER_LABELS[next]}
          </h2>
          <p className="font-mono text-sm text-slate-300">{timings[next]}</p>
        </div>
      </div>

      <p
        className="mt-3 font-mono text-4xl text-brass tabular-nums sm:text-5xl"
        aria-live="polite"
      >
        {formatCountdown(secondsRemaining)}
      </p>
    </div>
  );
}
