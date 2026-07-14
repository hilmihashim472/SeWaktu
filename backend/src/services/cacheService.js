/**
 * Simple in-memory cache for prayer time responses.
 * Keys are `${zone}-${YYYY-MM-DD}` where the date is "today" in
 * Asia/Kuala_Lumpur, so a new key (and therefore a cache miss) is produced
 * automatically once midnight passes there — no timer/eviction needed.
 */
const store = new Map();

export function getKualaLumpurDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // e.g. "2026-07-14"
}

export function buildCacheKey(zone) {
  return `${zone}-${getKualaLumpurDateKey()}`;
}

export function getCached(zone) {
  return store.get(buildCacheKey(zone));
}

export function setCached(zone, data) {
  store.set(buildCacheKey(zone), data);
  return data;
}

export function clearCache() {
  store.clear();
}

/**
 * Separate cache for monthly timetables. A given zone-month-year never
 * changes once published, so entries are cached indefinitely (until the
 * process restarts) rather than keyed off "today" like the daily cache.
 */
const monthlyStore = new Map();

function buildMonthCacheKey(zone, year, month) {
  return `${zone}-${year}-${String(month).padStart(2, "0")}`;
}

export function getCachedMonth(zone, year, month) {
  return monthlyStore.get(buildMonthCacheKey(zone, year, month));
}

export function setCachedMonth(zone, year, month, data) {
  monthlyStore.set(buildMonthCacheKey(zone, year, month), data);
  return data;
}
