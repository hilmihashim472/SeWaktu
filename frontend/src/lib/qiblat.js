const KAABA = { latitude: 21.4225, longitude: 39.8262 };
const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Attaches an errors.* translation key (see src/i18n) to a geolocation failure. */
function friendlyGeoError(error) {
  const codes = { 1: "geoDenied", 2: "geoUnavailable", 3: "geoTimeout" };
  const err = new Error(error.message || "Something went wrong detecting your location.");
  err.code = codes[error.code] || "geoGeneric";
  return err;
}

/** Resolves to { latitude, longitude } from the browser's geolocation. */
export function getCurrentCoords() {
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/** Initial great-circle bearing (degrees, clockwise from true north) from a point to the Kaaba. */
export function calculateQiblaBearing(latitude, longitude) {
  const φ1 = toRad(latitude);
  const λ1 = toRad(longitude);
  const φ2 = toRad(KAABA.latitude);
  const λ2 = toRad(KAABA.longitude);
  const Δλ = λ2 - λ1;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Great-circle distance (km) from a point to the Kaaba. */
export function calculateDistanceToKaaba(latitude, longitude) {
  const φ1 = toRad(latitude);
  const φ2 = toRad(KAABA.latitude);
  const Δφ = toRad(KAABA.latitude - latitude);
  const Δλ = toRad(KAABA.longitude - longitude);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** True on browsers (iOS Safari 13+) that gate motion/orientation sensors behind a user gesture. */
export function needsOrientationPermission() {
  return typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function";
}

/** Must be called from within a user gesture handler (e.g. a button click). */
export async function requestOrientationPermission() {
  const result = await DeviceOrientationEvent.requestPermission();
  if (result !== "granted") {
    const err = new Error("Compass access was denied.");
    err.code = "compassDenied";
    throw err;
  }
}

/** Extracts a compass heading (degrees, clockwise from true north) from a device orientation event. */
export function getCompassHeading(event) {
  if (typeof event.webkitCompassHeading === "number") {
    return event.webkitCompassHeading;
  }
  if (typeof event.alpha !== "number") return null;

  const screenAngle =
    typeof screen !== "undefined" && screen.orientation && typeof screen.orientation.angle === "number"
      ? screen.orientation.angle
      : typeof window.orientation === "number"
      ? window.orientation
      : 0;

  return (360 - event.alpha + screenAngle) % 360;
}
