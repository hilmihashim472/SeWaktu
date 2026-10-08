// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

/** Attaches an errors.* translation key (see src/i18n) to a geolocation failure. */
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
      (position) => resolve(position.coords),
      (error) => reject(friendlyGeoError(error)),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/** Resolves to { zone, districts, distanceKm } for the user's current location. */
export async function detectNearestZone() {
  const { latitude, longitude } = await getCurrentCoords();
  const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });

  const res = await fetch(`${API_URL}/api/zones/nearest?${params.toString()}`);
  if (!res.ok) {
    const err = new Error(`Backend responded with status ${res.status}`);
    err.code = "zoneFetchFailed";
    throw err;
  }
  const data = await res.json();
  if (!data.zone) {
    const err = new Error("Couldn't determine the nearest zone.");
    err.code = "zoneNotFound";
    throw err;
  }
  return data;
}
