import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const KIND_OPTIONS = [
  { value: "", label: "All" },
  { value: "masjid", label: "Masjid" },
  { value: "surau", label: "Surau" },
];

const inputClasses =
  "w-full appearance-none rounded-lg border border-white/15 bg-night-mid/80 py-2 pl-3 pr-3 text-sm text-slate-100 " +
  "placeholder:text-slate-500 transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <span className="relative block">
      <select className={`${inputClasses} pr-9 ${className}`} {...props}>
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function MasjidFilters({ filters, onChange }) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/masjid/states`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed to load states"))))
      .then(setStates)
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!filters.state) {
      setDistricts([]);
      return undefined;
    }
    let cancelled = false;
    fetch(`${API_URL}/api/masjid/districts?state=${encodeURIComponent(filters.state)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed to load districts"))))
      .then((rows) => {
        if (!cancelled) setDistricts(rows);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.state]);

  const activeCount = [filters.state, filters.district, filters.kind, filters.q].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200 sm:hidden"
        aria-expanded={mobileOpen}
      >
        <span className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brass/20 px-1.5 py-0.5 text-[10px] font-semibold text-brass-light">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`${mobileOpen ? "block" : "hidden"} p-4 pt-0 sm:block sm:pt-4`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="State">
            <Select
              value={filters.state}
              onChange={(e) => onChange({ state: e.target.value, district: "" })}
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state} ({s.count.toLocaleString()})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="District">
            <Select
              value={filters.district}
              disabled={!filters.state}
              onChange={(e) => onChange({ district: e.target.value })}
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district} ({d.count.toLocaleString()})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type">
            <div className="flex rounded-lg border border-white/15 bg-night-mid/80 p-1">
              {KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  onClick={() => onChange({ kind: opt.value })}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                    filters.kind === opt.value
                      ? "bg-brass/20 text-brass-light"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Search">
            <input
              type="search"
              value={filters.q}
              onChange={(e) => onChange({ q: e.target.value })}
              placeholder="Search by name…"
              className={inputClasses}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
