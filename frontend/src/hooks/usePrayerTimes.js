import { useCallback, useEffect, useState } from "react";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export default function usePrayerTimes(zone) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!zone) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/prayer-times/${zone}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`);
        }
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [zone, retryToken]);

  const retry = useCallback(() => setRetryToken((t) => t + 1), []);

  return { data, loading, error, retry };
}
