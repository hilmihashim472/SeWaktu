import { useEffect, useState } from "react";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

/** Looks up the human-readable districts label for a JAKIM zone code, so the
 * zone name is always correct regardless of how `zone` was set (stored from
 * a previous visit, geolocated, or picked from the zone popup). */
export default function useZoneName(zone) {
  const [zoneName, setZoneName] = useState("");

  useEffect(() => {
    if (!zone) return undefined;
    const controller = new AbortController();

    fetch(`${API_URL}/api/zones`, { signal: controller.signal })
      .then((res) => res.json())
      .then((zonesByState) => {
        for (const zonesInState of Object.values(zonesByState)) {
          const match = zonesInState.find((z) => z.code === zone);
          if (match) {
            setZoneName(match.districts);
            return;
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [zone]);

  return zoneName;
}
