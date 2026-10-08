import { useState } from "react";
import { Link } from "react-router-dom";
import ZoneSelectorModal from "../components/ZoneSelectorModal";
import PrayerHero from "../components/PrayerHero";
import PrayerGrid from "../components/PrayerGrid";
import { useLanguage } from "../contexts/LanguageContext";
import usePageMeta from "../hooks/usePageMeta";

function PrayerSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-4 w-48 rounded bg-tint-strong" />
        <div className="h-6 w-40 rounded-full bg-tint-strong" />
      </div>
      <div className="h-52 w-52 rounded-full border-4 border-line sm:h-60 sm:w-60" />
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-line bg-tint" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-accent"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.4 20.5h17.2a1.5 1.5 0 0 0 1.3-2.46L13.71 3.86a1.5 1.5 0 0 0-2.42 0z"
        />
      </svg>
      <div>
        <p className="font-serif text-lg text-ink-200">{t("prayerTimes.errorTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-400">{t("prayerTimes.errorBody")}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

export default function PrayerTimesPage({
  zone,
  setZone,
  zoneName,
  data,
  loading,
  error,
  retry,
  next,
  current,
  secondsRemaining,
  progress,
}) {
  const { t } = useLanguage();
  usePageMeta({ description: t("seo.homeDescription") });
  const [isZoneModalOpen, setZoneModalOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <main className="flex flex-1 flex-col gap-8">
        {loading && <PrayerSkeleton />}

        {!loading && error && <ErrorState onRetry={retry} />}

        {!loading && !error && data && (
          <div key={zone} className="flex flex-col gap-8 animate-fade-in-up">
            <div className="flex flex-col items-center gap-1">
              <p className="font-serif text-lg text-ink-300">
                {t(`days.${data.day.toLowerCase()}`)}, {data.date}{" "}
                <span className="text-ink-500">· {data.hijri} H</span>
              </p>

              <span className="my-1 h-px w-full max-w-xs bg-brass/30" aria-hidden="true" />

              <PrayerHero
                timings={data.timings}
                next={next}
                secondsRemaining={secondsRemaining}
                progress={progress}
                zoneName={zoneName}
                onChangeZone={() => setZoneModalOpen(true)}
              />
            </div>
            <PrayerGrid timings={data.timings} next={next} current={current} />

            <Link
              to="/timetable"
              className="mx-auto flex items-center gap-1 text-sm text-accent-strong underline decoration-brass/40 underline-offset-2 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {t("prayerTimes.viewFullMonth")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </main>

      {isZoneModalOpen && (
        <ZoneSelectorModal zone={zone} onChange={setZone} onClose={() => setZoneModalOpen(false)} />
      )}
    </div>
  );
}
