import { Link } from "react-router-dom";
import ZoneSelector from "../components/ZoneSelector";
import PrayerHero from "../components/PrayerHero";
import PrayerGrid from "../components/PrayerGrid";

function PrayerSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="h-6 w-40 rounded-full bg-white/10" />
      </div>
      <div className="h-52 w-52 rounded-full border-4 border-white/10 sm:h-60 sm:w-60" />
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-white/10 bg-white/5" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-brass/70"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.4 20.5h17.2a1.5 1.5 0 0 0 1.3-2.46L13.71 3.86a1.5 1.5 0 0 0-2.42 0z"
        />
      </svg>
      <div>
        <p className="font-serif text-lg text-slate-200">Couldn't reach the prayer times service</p>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          Please make sure the backend is running, then try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-brass-light transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        Retry
      </button>
    </div>
  );
}

export default function PrayerTimesPage({
  zone,
  setZone,
  zoneName,
  setZoneName,
  data,
  loading,
  error,
  retry,
  next,
  current,
  secondsRemaining,
  progress,
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <main className="flex flex-1 flex-col gap-8">
        {loading && <PrayerSkeleton />}

        {!loading && error && <ErrorState onRetry={retry} />}

        {!loading && !error && data && (
          <div key={zone} className="flex flex-col gap-8 animate-fade-in-up">
            <div className="flex flex-col items-center gap-1">
              <p className="font-serif text-lg text-slate-300">
                {data.day}, {data.date} <span className="text-slate-500">· {data.hijri} H</span>
              </p>

              <span className="my-1 h-px w-full max-w-xs bg-brass/30" aria-hidden="true" />

              <PrayerHero
                timings={data.timings}
                next={next}
                secondsRemaining={secondsRemaining}
                progress={progress}
                zoneName={zoneName}
              />
            </div>
            <PrayerGrid timings={data.timings} next={next} current={current} />

            <Link
              to="/timetable"
              className="mx-auto flex items-center gap-1 text-sm text-brass-light underline decoration-brass/40 underline-offset-2 transition-colors hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              View full month
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </main>

      <div className="flex justify-center">
        <ZoneSelector zone={zone} onChange={setZone} onZoneNameChange={setZoneName} />
      </div>
    </div>
  );
}
