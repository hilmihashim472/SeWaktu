import { useLanguage } from "../../contexts/LanguageContext";

const buttonClasses =
  "flex items-center gap-1 rounded-lg border border-line bg-surface-control px-2.5 py-1.5 text-sm text-ink-200 " +
  "transition-colors hover:border-brass/40 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-40 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:px-3";

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

export default function MonthNavigator({ month, year, onChange }) {
  const { t } = useLanguage();
  const { year: currentYear, month: currentMonth } = getCurrentKLYearMonth();
  const atEarliestMonth = year * 12 + (month - 1) <= currentYear * 12 + (currentMonth - 1);

  const goPrev = () => {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    onChange(m, y);
  };

  const goNext = () => {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    onChange(m, y);
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <button
        type="button"
        onClick={goPrev}
        disabled={atEarliestMonth}
        aria-label={t("monthNavigator.prev")}
        className={buttonClasses}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">{t("monthNavigator.prev")}</span>
      </button>

      <h2 className="min-w-[7rem] text-center font-serif text-lg text-ink-100 sm:min-w-[10rem] sm:text-2xl">
        {t("monthNavigator.months")[month - 1]} {year}
      </h2>

      <button
        type="button"
        onClick={goNext}
        aria-label={t("monthNavigator.next")}
        className={buttonClasses}
      >
        <span className="hidden sm:inline">{t("monthNavigator.next")}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
