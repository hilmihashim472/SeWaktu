import { useEffect, useState } from "react";
import useDebounce from "./useDebounce";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

/** Fetches /api/mosques for the given filters — same shape as
 * useMasjidSearch, plus nearby (lat/lng/radius) and sort support. Debounces
 * the search text and cancels in-flight requests when filters change again
 * before the previous request resolves. */
export default function useMosqueSearch({
  search,
  state,
  district,
  type,
  nearby,
  radius,
  sort,
  page = 1,
  // High enough to cover the whole live dataset (~7.2k rows) in one request —
  // the map needs every matching marker at once for clustering, and the card
  // grid below it paginates client-side over this same already-fetched set
  // rather than making a second request.
  limit = 10000,
}) {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    if (type) params.set("type", type);
    if (nearby) {
      params.set("lat", String(nearby.latitude));
      params.set("lng", String(nearby.longitude));
      params.set("radius", String(radius));
      params.set("sort", "distance");
    } else if (sort) {
      params.set("sort", sort);
    }
    params.set("page", String(page));
    params.set("limit", String(limit));

    fetch(`${API_URL}/api/mosques?${params.toString()}`, { signal: controller.signal })
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
  }, [debouncedSearch, state, district, type, nearby, radius, sort, page, limit, retryToken]);

  const retry = () => setRetryToken((t) => t + 1);

  return { results, total, totalPages, loading, error, retry };
}
