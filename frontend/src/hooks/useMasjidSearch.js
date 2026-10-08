import { useEffect, useState } from "react";
import useDebounce from "./useDebounce";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

/** Fetches /api/masjid for the given filters, debouncing the search text
 * and cancelling in-flight requests when filters change again before the
 * previous request resolves. */
export default function useMasjidSearch({ state, district, kind, q, page, limit = 50 }) {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    if (kind) params.set("kind", kind);
    if (debouncedQ) params.set("q", debouncedQ);
    params.set("page", String(page));
    params.set("limit", String(limit));

    fetch(`${API_URL}/api/masjid?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setResults(json.data);
        setTotal(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [state, district, kind, debouncedQ, page, limit, retryToken]);

  const retry = () => setRetryToken((t) => t + 1);

  return { results, total, totalPages, loading, error, retry };
}
