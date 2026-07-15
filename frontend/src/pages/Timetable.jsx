import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ZoneSelectorCompact from "../components/timetable/ZoneSelectorCompact";
import MonthNavigator from "../components/timetable/MonthNavigator";
import DateFilter from "../components/timetable/DateFilter";
import TimetableTable from "../components/timetable/TimetableTable";
import useTimetable from "../hooks/useTimetable";
import { PRAYER_LABELS } from "../components/PrayerGrid";
import { useLanguage } from "../contexts/LanguageContext";

const MAX_MONTHS_AHEAD = 12;

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

function getKLTodayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${year}-${month}-${day}`;
}

// Last selectable day, matching the backend's "MAX_MONTHS_AHEAD" cap.
function getMaxSelectableISO(currentYear, currentMonth) {
  const targetIndex = currentMonth - 1 + MAX_MONTHS_AHEAD;
  const targetYear = currentYear + Math.floor(targetIndex / 12);
  const targetMonth = (targetIndex % 12) + 1;
  const lastDay = new Date(targetYear, targetMonth, 0).getDate();
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** "2026-07-15" -> "15-Jul-2026", matching the API's day.date format. Uses a
 * fixed UTC date (no time component) so no local-timezone shifting occurs. */
function isoToDisplayDate(iso) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(Date.UTC(year, month - 1, day)));
  const d = parts.find((p) => p.type === "day").value;
  const m = parts.find((p) => p.type === "month").value;
  const y = parts.find((p) => p.type === "year").value;
  return `${d}-${m}-${y}`;
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

export default function Timetable({ zone, setZone, zoneName }) {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { year: currentYear, month: currentMonth } = getCurrentKLYearMonth();

  const month = Number.parseInt(searchParams.get("month"), 10) || currentMonth;
  const year = Number.parseInt(searchParams.get("year"), 10) || currentYear;
  const selectedDate = searchParams.get("date") ?? "";

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
      next.delete("date"); // a single-date filter from a different month no longer applies
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleDateChange = useCallback(
    (iso) => {
      if (!iso) return;
      const [pickedYear, pickedMonth] = iso.split("-").map(Number);
      const next = new URLSearchParams(searchParams);
      next.set("month", String(pickedMonth));
      next.set("year", String(pickedYear));
      next.set("date", iso);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleClearDate = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("date");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const displayedDays = selectedDate
    ? (data?.days ?? []).filter((d) => d.date === isoToDisplayDate(selectedDate))
    : (data?.days ?? []);

  const handleExport = () => {
    if (displayedDays.length) downloadTimetableCsv(zone, month, year, displayedDays);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl text-ink-100 sm:text-4xl">
          {t("timetable.titlePrefix")} <span className="text-accent">{t("timetable.titleAccent")}</span>
        </h1>
        {zoneName && <p className="mt-1 text-sm text-ink-400">{zoneName}</p>}
      </div>

      <div className="flex justify-center">
        <ZoneSelectorCompact zone={zone} onChange={setZone}>
          <DateFilter
            value={selectedDate}
            min={getKLTodayISO()}
            max={getMaxSelectableISO(currentYear, currentMonth)}
            onChange={handleDateChange}
          />
        </ZoneSelectorCompact>
      </div>

      <div className="flex flex-col items-center gap-2">
        <MonthNavigator month={month} year={year} onChange={handleMonthChange} />
        {selectedDate && (
          <button
            type="button"
            onClick={handleClearDate}
            className="text-sm text-accent-strong underline decoration-brass/40 underline-offset-2 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            {t("timetable.showFullMonth")}
          </button>
        )}
      </div>

      <TimetableTable
        days={displayedDays}
        month={month}
        year={year}
        loading={loading}
        error={error}
        onRetry={retry}
        filteredToSingleDate={Boolean(selectedDate)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-ink-500">
          {!loading && !error && data
            ? (data.source === "jakim" ? t("timetable.sourceJakim") : t("timetable.sourceAladhan"))
            : " "}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={!displayedDays.length}
          className="flex items-center gap-2 rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M4 19.5h16" />
          </svg>
          {t("timetable.exportCsv")}
        </button>
      </div>
    </div>
  );
}
