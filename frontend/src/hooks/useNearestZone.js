import { useCallback, useState } from "react";
import { detectNearestZone } from "../lib/nearestZone";

/** Wraps detectNearestZone with loading/error state for UI feedback. */
export default function useNearestZone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await detectNearestZone();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { detect, loading, error };
}
