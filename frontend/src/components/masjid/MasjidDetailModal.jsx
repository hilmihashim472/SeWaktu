import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const KIND_STYLES = {
  masjid: "bg-brass/15 text-brass-light border-brass/30",
  surau: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

function DetailRow({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-t border-white/10 py-2 first:border-t-0 first:pt-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="break-words text-sm text-brass-light underline decoration-brass/40 underline-offset-2 hover:text-brass"
        >
          {value}
        </a>
      ) : (
        <span className="break-words text-sm text-slate-200">{value}</span>
      )}
    </div>
  );
}

export default function MasjidDetailModal({ id, onClose }) {
  const [masjid, setMasjid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMasjid(null);

    fetch(`${API_URL}/api/masjid/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then(setMasjid)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const website = masjid?.website
    ? masjid.website.startsWith("http")
      ? masjid.website
      : `https://${masjid.website}`
    : null;
  const directionsUrl = masjid
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [masjid.name, masjid.address].filter(Boolean).join(", ")
      )}`
    : null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={masjid?.name ?? "Masjid detail"}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-night-mid p-6 shadow-2xl animate-fade-in-up"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:text-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {loading && (
          <div className="animate-pulse space-y-3 py-4 pr-8">
            <div className="h-6 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/10" />
            <div className="h-24 rounded bg-white/10" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-slate-300">Couldn't load this record.</p>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-brass-light underline decoration-brass/40 underline-offset-2 hover:text-brass"
            >
              Close
            </button>
          </div>
        )}

        {!loading && !error && masjid && (
          <>
            <h2 className="pr-8 font-serif text-2xl leading-tight text-slate-100">{masjid.name}</h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_STYLES[masjid.kind] ?? KIND_STYLES.masjid}`}
              >
                {masjid.kind}
              </span>
              {masjid.category && (
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                  {masjid.category}
                </span>
              )}
            </div>

            <div className="mt-4 divide-y divide-white/5">
              <DetailRow label="Address" value={masjid.address} />
              <DetailRow label="State" value={masjid.state} />
              <DetailRow label="District" value={masjid.district} />
              <DetailRow
                label="Phone"
                value={masjid.phone}
                href={masjid.phone ? `tel:${masjid.phone}` : undefined}
              />
              <DetailRow label="Fax" value={masjid.fax} />
              <DetailRow
                label="Email"
                value={masjid.email}
                href={masjid.email ? `mailto:${masjid.email}` : undefined}
              />
              <DetailRow label="Website" value={masjid.website} href={website ?? undefined} />
              <DetailRow label="Capacity" value={masjid.capacity} />
            </div>

            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-brass/60 bg-brass/10 px-4 py-2.5 text-sm font-medium text-brass-light transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21z"
                  />
                  <circle cx="12" cy="9.5" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Get Directions
              </a>
            )}

            <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-slate-600">
              Source: {masjid.source === "jais" ? "JAIS e-Masjid" : "SISMIM (JAKIM)"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
