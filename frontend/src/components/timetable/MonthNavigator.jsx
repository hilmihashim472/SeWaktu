const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const buttonClasses =
  "flex items-center gap-1 rounded-lg border border-white/15 bg-night-mid/80 px-3 py-1.5 text-sm text-slate-200 " +
  "transition-colors hover:border-brass/40 hover:text-brass-light disabled:pointer-events-none disabled:opacity-40 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

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
    <div className="flex items-center justify-center gap-4">
      <button type="button" onClick={goPrev} disabled={atEarliestMonth} className={buttonClasses}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Prev
      </button>

      <h2 className="min-w-[10rem] text-center font-serif text-xl text-slate-100 sm:text-2xl">
        {MONTH_NAMES[month - 1]} {year}
      </h2>

      <button type="button" onClick={goNext} className={buttonClasses}>
        Next
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
