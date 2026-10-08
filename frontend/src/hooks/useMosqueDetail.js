import { useEffect, useState } from "react";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export default function useMosqueDetail(id) {
  const [mosque, setMosque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMosque(null);

    fetch(`${API_URL}/api/mosques/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then(setMosque)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  return { mosque, loading, error };
}
