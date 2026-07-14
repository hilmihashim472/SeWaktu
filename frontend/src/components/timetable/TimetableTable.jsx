import { PRAYER_LABELS } from "../PrayerGrid";

const PRAYER_KEYS = Object.keys(PRAYER_LABELS);

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function todayKLDateString() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date());
  const day = parts.find((p) => p.type === "day").value;
  const month = parts.find((p) => p.type === "month").value;
  const year = parts.find((p) => p.type === "year").value;
  return `${day}-${month}-${year}`;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 py-16 text-center">
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
        <p className="font-serif text-lg text-slate-200">Couldn't load the timetable</p>
        {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
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

/* ---------- Desktop / tablet: real table, sm and up ---------- */

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="sticky left-0 bg-night-deep px-3 py-2">
        <div className="h-3 w-16 rounded bg-white/10" />
      </td>
      <td className="px-3 py-2">
        <div className="h-3 w-14 rounded bg-white/10" />
      </td>
      <td className="px-3 py-2">
        <div className="h-3 w-20 rounded bg-white/10" />
      </td>
      {PRAYER_KEYS.map((key) => (
        <td key={key} className="px-3 py-2">
          <div className="mx-auto h-3 w-10 rounded bg-white/10" />
        </td>
      ))}
    </tr>
  );
}

function DesktopTable({ days, loading, skeletonRows, today }) {
  return (
    <div className="hidden max-h-[70vh] overflow-auto rounded-xl border border-white/10 sm:block">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-night-mid">
          <tr>
            <th className="sticky left-0 z-20 bg-night-mid px-3 py-2 text-left font-serif font-normal text-slate-300">
              Date
            </th>
            <th className="px-3 py-2 text-left font-serif font-normal text-slate-300">Day</th>
            <th className="px-3 py-2 text-left font-serif font-normal text-slate-300">Hijri</th>
            {PRAYER_KEYS.map((key) => (
              <th key={key} className="px-3 py-2 text-center font-serif font-normal text-slate-300">
                {PRAYER_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 font-mono">
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => <SkeletonRow key={i} />)
            : days.map((dayEntry, i) => {
                const isToday = dayEntry.date === today;
                const rowBg = isToday ? "bg-brass/15" : i % 2 === 1 ? "bg-white/[0.03]" : "";
                return (
                  <tr key={dayEntry.date} className={rowBg}>
                    <td
                      className={`sticky left-0 px-3 py-2 text-slate-200 ${isToday ? "bg-brass/15" : i % 2 === 1 ? "bg-[#0F2530]" : "bg-night-deep"}`}
                    >
                      {dayEntry.date}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{dayEntry.day}</td>
                    <td className="px-3 py-2 text-slate-400">{dayEntry.hijri}</td>
                    {PRAYER_KEYS.map((key) => (
                      <td
                        key={key}
                        className={`px-3 py-2 text-center tabular-nums ${isToday ? "text-brass-light" : "text-slate-200"}`}
                      >
                        {dayEntry.timings[key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Mobile: one stacked card per day, below sm ---------- */

function MobileSkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="h-4 w-36 rounded bg-white/10" />
      <div className="mt-2 h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 space-y-2">
        {PRAYER_KEYS.map((key) => (
          <div key={key} className="h-3 w-full rounded bg-white/10" />
        ))}
      </div>
    </div>
  );
}

function DayCard({ dayEntry, isToday }) {
  return (
    <div
      className={`rounded-xl border p-4 ${isToday ? "border-brass/40 bg-brass/15" : "border-white/10 bg-white/5"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`font-serif text-base ${isToday ? "text-brass-light" : "text-slate-100"}`}>
          {dayEntry.day}, {dayEntry.date}
        </p>
        {isToday && (
          <span className="shrink-0 rounded-full bg-brass/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass-light">
            Today
          </span>
        )}
      </div>
      <p className="mt-0.5 font-mono text-xs text-slate-500">{dayEntry.hijri} H</p>

      <div className="mt-3 divide-y divide-white/5">
        {PRAYER_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-slate-400">{PRAYER_LABELS[key]}</span>
            <span
              className={`font-mono text-sm tabular-nums ${isToday ? "text-brass-light" : "text-slate-200"}`}
            >
              {dayEntry.timings[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCards({ days, loading, skeletonRows, today }) {
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {loading
        ? Array.from({ length: skeletonRows }).map((_, i) => <MobileSkeletonCard key={i} />)
        : days.map((dayEntry) => (
            <DayCard key={dayEntry.date} dayEntry={dayEntry} isToday={dayEntry.date === today} />
          ))}
    </div>
  );
}

export default function TimetableTable({ days, month, year, loading, error, onRetry }) {
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;

  const today = todayKLDateString();
  const skeletonRows = daysInMonth(month, year);

  return (
    <>
      <DesktopTable days={days} loading={loading} skeletonRows={skeletonRows} today={today} />
      <MobileCards days={days} loading={loading} skeletonRows={skeletonRows} today={today} />
    </>
  );
}
