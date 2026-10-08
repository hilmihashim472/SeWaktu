import { useEffect, useState } from "react";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export default function useTimetable({ zone, month, year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!zone) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ month: String(month), year: String(year) });

    fetch(`${API_URL}/api/timetable/${zone}?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.message || `Backend responded with status ${res.status}`);
        }
        return body;
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [zone, month, year, retryToken]);

  const retry = () => setRetryToken((t) => t + 1);

  return { data, loading, error, retry };
}
