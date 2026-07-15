import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const selectClasses =
  "w-full appearance-none rounded-lg border border-line bg-surface-control py-2 pl-3 pr-9 text-sm text-ink-100 " +
  "transition-colors hover:border-line-strong focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">{label}</span>
      <span className="relative block">
        {children}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

export default function ZoneSelector({ zone, onChange, stacked = false, children }) {
  const { t } = useLanguage();
  const [zonesByState, setZonesByState] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/zones`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setZonesByState(json);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!zonesByState) return;
    const match = Object.entries(zonesByState).find(([, zonesInState]) =>
      zonesInState.some((z) => z.code === zone)
    );
    if (match) setSelectedState(match[0]);
  }, [zone, zonesByState]);

  const states = useMemo(
    () => (zonesByState ? Object.keys(zonesByState).sort() : []),
    [zonesByState]
  );
  const zonesForState = selectedState && zonesByState ? zonesByState[selectedState] : [];

  if (loadError) {
    return <p className="text-sm text-negative">{t("zoneSelector.loadError")}</p>;
  }

  const handleStateChange = (event) => {
    const nextState = event.target.value;
    setSelectedState(nextState);
    const firstZone = zonesByState?.[nextState]?.[0];
    if (firstZone) onChange(firstZone.code);
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-line bg-tint p-3 backdrop-blur-sm ${stacked ? "" : "sm:flex-row sm:items-end"}`}
    >
      <Field label={t("zoneSelector.state")}>
        <select
          aria-label={t("zoneSelector.state")}
          className={selectClasses}
          value={selectedState}
          disabled={!zonesByState}
          onChange={handleStateChange}
        >
          {!selectedState && (
            <option value="">
              {zonesByState ? t("zoneSelector.selectState") : t("zoneSelector.loading")}
            </option>
          )}
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("zoneSelector.zone")}>
        <select
          aria-label={t("zoneSelector.zone")}
          className={selectClasses}
          value={zone}
          disabled={!selectedState}
          onChange={(event) => onChange(event.target.value)}
        >
          {zonesForState.map((z) => (
            <option key={z.code} value={z.code}>
              {z.code} — {z.districts}
            </option>
          ))}
        </select>
      </Field>

      {children}
    </div>
  );
}
