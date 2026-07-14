import { getCoordinatesForZone } from "../data/zoneCoordinates.js";
import { getCached, setCached, getCachedMonth, setCachedMonth } from "./cacheService.js";

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 8000;
const JAKIM_BASE_URL = "https://www.e-solat.gov.my/index.php";
const ALADHAN_BASE_URL = "https://api.aladhan.com/v1/timings";
const ALADHAN_CALENDAR_BASE_URL = "https://api.aladhan.com/v1/calendar";
const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

class UpstreamError extends Error {}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** "14-07-2026" (DD-MM-YYYY) for the current date in Asia/Kuala_Lumpur, as required by Aladhan. */
function todayAladhanDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const day = parts.find((p) => p.type === "day").value;
  const month = parts.find((p) => p.type === "month").value;
  const year = parts.find((p) => p.type === "year").value;
  return `${day}-${month}-${year}`;
}

/** Current timestamp expressed in the fixed Asia/Kuala_Lumpur (+08:00) offset. */
function kualaLumpurNowISOString() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const kl = new Date(utcMs + 8 * 60 * 60000);
  return (
    `${kl.getUTCFullYear()}-${pad(kl.getUTCMonth() + 1)}-${pad(kl.getUTCDate())}` +
    `T${pad(kl.getUTCHours())}:${pad(kl.getUTCMinutes())}:${pad(kl.getUTCSeconds())}+08:00`
  );
}

function trimSeconds(hms) {
  // "06:02:00" -> "06:02", also strips Aladhan's " (+08)" suffix if present.
  return String(hms).split(" ")[0].slice(0, 5);
}

async function fetchWithTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new UpstreamError(`Request to ${url} failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromJakim(zone) {
  const url = `${JAKIM_BASE_URL}?r=esolatApi/takwimsolat&zone=${encodeURIComponent(zone)}&period=today`;
  const data = await fetchWithTimeout(url);

  if (data?.status !== "OK!" || !Array.isArray(data.prayerTime) || data.prayerTime.length === 0) {
    throw new UpstreamError("JAKIM response was malformed or reported a non-OK status");
  }

  const p = data.prayerTime[0];
  return {
    source: "jakim",
    zone,
    date: p.date,
    day: p.day,
    hijri: p.hijri,
    timings: {
      imsak: trimSeconds(p.imsak),
      fajr: trimSeconds(p.fajr),
      syuruk: trimSeconds(p.syuruk),
      dhuhr: trimSeconds(p.dhuhr),
      asr: trimSeconds(p.asr),
      maghrib: trimSeconds(p.maghrib),
      isha: trimSeconds(p.isha),
    },
    cachedAt: kualaLumpurNowISOString(),
  };
}

async function fetchFromAladhan(zone) {
  const { latitude, longitude } = getCoordinatesForZone(zone);
  const url = `${ALADHAN_BASE_URL}/${todayAladhanDate()}?latitude=${latitude}&longitude=${longitude}&method=17`;
  const data = await fetchWithTimeout(url);

  const timings = data?.data?.timings;
  const dateInfo = data?.data?.date;
  if (data?.code !== 200 || !timings || !dateInfo) {
    throw new UpstreamError("Aladhan response was malformed or reported a non-200 code");
  }

  const gregorian = dateInfo.gregorian;
  const hijri = dateInfo.hijri;
  const monthAbbrev = MONTH_ABBREVIATIONS[Number(gregorian.month.number) - 1];

  return {
    source: "aladhan-fallback",
    zone,
    date: `${pad(gregorian.day)}-${monthAbbrev}-${gregorian.year}`,
    day: gregorian.weekday.en,
    hijri: `${hijri.year}-${pad(hijri.month.number)}-${pad(hijri.day)}`,
    timings: {
      imsak: trimSeconds(timings.Imsak),
      fajr: trimSeconds(timings.Fajr),
      syuruk: trimSeconds(timings.Sunrise),
      dhuhr: trimSeconds(timings.Dhuhr),
      asr: trimSeconds(timings.Asr),
      maghrib: trimSeconds(timings.Maghrib),
      isha: trimSeconds(timings.Isha),
    },
    cachedAt: kualaLumpurNowISOString(),
  };
}

/**
 * Returns today's normalized prayer times for a JAKIM zone, using an
 * in-memory cache keyed by zone + Kuala Lumpur calendar date, and falling
 * back from JAKIM's e-Solat API to Aladhan (method=17) on any failure.
 */
export async function getPrayerTimesForZone(zone) {
  const cached = getCached(zone);
  if (cached) return cached;

  try {
    const result = await fetchFromJakim(zone);
    return setCached(zone, result);
  } catch (jakimError) {
    try {
      const result = await fetchFromAladhan(zone);
      return setCached(zone, result);
    } catch (aladhanError) {
      const error = new UpstreamError(
        `Both JAKIM and Aladhan failed for zone "${zone}": ` +
          `JAKIM error: ${jakimError.message}; Aladhan error: ${aladhanError.message}`
      );
      error.cause = { jakimError, aladhanError };
      throw error;
    }
  }
}

/** true if (month, year) is the current calendar month in Asia/Kuala_Lumpur. */
function isCurrentKLMonth(month, year) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const currentYear = Number(parts.find((p) => p.type === "year").value);
  const currentMonth = Number(parts.find((p) => p.type === "month").value);
  return month === currentMonth && year === currentYear;
}

/**
 * JAKIM's period=month always returns the *current* month regardless of
 * query params, so this is only ever called when the requested month is
 * the current one.
 */
async function fetchMonthFromJakim(zone) {
  const url = `${JAKIM_BASE_URL}?r=esolatApi/takwimsolat&zone=${encodeURIComponent(zone)}&period=month`;
  const data = await fetchWithTimeout(url);

  if (data?.status !== "OK!" || !Array.isArray(data.prayerTime) || data.prayerTime.length === 0) {
    throw new UpstreamError("JAKIM period=month response was malformed or reported a non-OK status");
  }

  return data.prayerTime.map((p) => ({
    date: p.date,
    day: p.day,
    hijri: p.hijri,
    timings: {
      imsak: trimSeconds(p.imsak),
      fajr: trimSeconds(p.fajr),
      syuruk: trimSeconds(p.syuruk),
      dhuhr: trimSeconds(p.dhuhr),
      asr: trimSeconds(p.asr),
      maghrib: trimSeconds(p.maghrib),
      isha: trimSeconds(p.isha),
    },
  }));
}

async function fetchMonthFromAladhan(zone, month, year) {
  const { latitude, longitude } = getCoordinatesForZone(zone);
  const url = `${ALADHAN_CALENDAR_BASE_URL}/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=17`;
  const data = await fetchWithTimeout(url);

  if (data?.code !== 200 || !Array.isArray(data.data) || data.data.length === 0) {
    throw new UpstreamError("Aladhan calendar response was malformed or reported a non-200 code");
  }

  return data.data.map((entry) => {
    const gregorian = entry.date.gregorian;
    const hijri = entry.date.hijri;
    const monthAbbrev = MONTH_ABBREVIATIONS[Number(gregorian.month.number) - 1];
    return {
      date: `${pad(gregorian.day)}-${monthAbbrev}-${gregorian.year}`,
      day: gregorian.weekday.en,
      hijri: `${hijri.year}-${pad(hijri.month.number)}-${pad(hijri.day)}`,
      timings: {
        imsak: trimSeconds(entry.timings.Imsak),
        fajr: trimSeconds(entry.timings.Fajr),
        syuruk: trimSeconds(entry.timings.Sunrise),
        dhuhr: trimSeconds(entry.timings.Dhuhr),
        asr: trimSeconds(entry.timings.Asr),
        maghrib: trimSeconds(entry.timings.Maghrib),
        isha: trimSeconds(entry.timings.Isha),
      },
    };
  });
}

/**
 * Returns a full month of normalized prayer times for a JAKIM zone.
 * JAKIM's period=month endpoint only ever serves the current month, so
 * any other month (past or future) goes straight to Aladhan's calendar
 * endpoint instead. Results are cached indefinitely per zone-year-month
 * since a published month's timings never change.
 */
export async function fetchMonthlyTimings(zone, month, year) {
  const cached = getCachedMonth(zone, year, month);
  if (cached) return cached;

  if (!isCurrentKLMonth(month, year)) {
    const days = await fetchMonthFromAladhan(zone, month, year);
    return setCachedMonth(zone, year, month, { zone, month, year, source: "aladhan-fallback", days });
  }

  try {
    const days = await fetchMonthFromJakim(zone);
    return setCachedMonth(zone, year, month, { zone, month, year, source: "jakim", days });
  } catch (jakimError) {
    try {
      const days = await fetchMonthFromAladhan(zone, month, year);
      return setCachedMonth(zone, year, month, { zone, month, year, source: "aladhan-fallback", days });
    } catch (aladhanError) {
      const error = new UpstreamError(
        `Both JAKIM and Aladhan failed for zone "${zone}" month ${month}/${year}: ` +
          `JAKIM error: ${jakimError.message}; Aladhan error: ${aladhanError.message}`
      );
      error.cause = { jakimError, aladhanError };
      throw error;
    }
  }
}

export { UpstreamError };
