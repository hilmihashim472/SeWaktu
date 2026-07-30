import { useCallback, useState } from "react";

/** Attaches an errors.* translation key (see src/i18n) to a geolocation
 * failure — same convention as lib/nearestZone.js and lib/qiblat.js,
 * duplicated locally rather than shared since that's this codebase's
 * existing per-feature pattern for this small amount of logic. */
function friendlyGeoError(error) {
  const codes = { 1: "geoDenied", 2: "geoUnavailable", 3: "geoTimeout" };
  const err = new Error(error.message || "Something went wrong detecting your location.");
  err.code = codes[error.code] || "geoGeneric";
  return err;
}

function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      const err = new Error("Geolocation isn't supported by this browser.");
      err.code = "geoUnsupported";
      reject(err);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(friendlyGeoError(error)),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/** Wraps browser geolocation with loading/error state for the mosque
 * "near me" search. */
export default function useNearbySearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const locate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await getCurrentCoords();
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { locate, loading, error };
}
