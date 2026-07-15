import { useLanguage } from "../../contexts/LanguageContext";

export default function DateFilter({ value, min, max, onChange }) {
  const { t } = useLanguage();
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">{t("dateFilter.jumpToDate")}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-line bg-surface-control px-3 py-2 text-sm text-ink-100 transition-colors hover:border-line-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      />
    </label>
  );
}
