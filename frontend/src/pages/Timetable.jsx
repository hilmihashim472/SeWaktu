import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ZoneSelectorCompact from "../components/timetable/ZoneSelectorCompact";
import MonthNavigator from "../components/timetable/MonthNavigator";
import TimetableTable from "../components/timetable/TimetableTable";
import useTimetable from "../hooks/useTimetable";
import { PRAYER_LABELS } from "../components/PrayerGrid";

function getCurrentKLYearMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  return {
    year: Number(parts.find((p) => p.type === "year").value),
    month: Number(parts.find((p) => p.type === "month").value),
  };
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadTimetableCsv(zone, month, year, days) {
  const prayerKeys = Object.keys(PRAYER_LABELS);
  const header = ["Date", "Day", "Hijri", ...prayerKeys.map((key) => PRAYER_LABELS[key])];
  const rows = days.map((d) => [d.date, d.day, d.hijri, ...prayerKeys.map((key) => d.timings[key])]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sewaktu-timetable-${zone}-${year}-${String(month).padStart(2, "0")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Timetable({ zone, setZone, zoneName, setZoneName }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { year: currentYear, month: currentMonth } = getCurrentKLYearMonth();

  const month = Number.parseInt(searchParams.get("month"), 10) || currentMonth;
  const year = Number.parseInt(searchParams.get("year"), 10) || currentYear;

  // One-time hydration: a deep-linked ?zone= takes priority over the shared/stored zone.
  // Deliberately runs once on mount only — re-checking on every zone change would fight
  // the effect below, which is what keeps the URL's zone in sync going forward.
  useEffect(() => {
    const urlZone = searchParams.get("zone");
    if (urlZone && urlZone !== zone) setZone(urlZone);
  }, []);

  // Keep the URL a live mirror of the current view, for shareable/bookmarkable links.
  // searchParams/setSearchParams are deliberately excluded from deps: this effect is what
  // changes searchParams, so depending on it would make the effect re-trigger itself.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("zone", zone);
    next.set("month", String(month));
    next.set("year", String(year));
    setSearchParams(next, { replace: true });
  }, [zone, month, year]);

  const { data, loading, error, retry } = useTimetable({ zone, month, year });

  const handleMonthChange = useCallback(
    (nextMonth, nextYear) => {
      const next = new URLSearchParams(searchParams);
      next.set("month", String(nextMonth));
      next.set("year", String(nextYear));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleExport = () => {
    if (data?.days?.length) downloadTimetableCsv(zone, month, year, data.days);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-slate-100 sm:text-4xl">
          Monthly <span className="text-brass">Timetable</span>
        </h1>
        {zoneName && <p className="mt-1 text-sm text-slate-400">{zoneName}</p>}
      </div>

      <div className="flex justify-center">
        <ZoneSelectorCompact zone={zone} onChange={setZone} onZoneNameChange={setZoneName} />
      </div>

      <MonthNavigator month={month} year={year} onChange={handleMonthChange} />

      <TimetableTable
        days={data?.days ?? []}
        month={month}
        year={year}
        loading={loading}
        error={error}
        onRetry={retry}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-slate-500">
          {!loading && !error && data
            ? `Source: ${data.source === "jakim" ? "JAKIM" : "Aladhan (fallback)"}`
            : " "}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={!data?.days?.length}
          className="flex items-center gap-2 rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-brass-light transition-colors hover:bg-brass/20 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M4 19.5h16" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
