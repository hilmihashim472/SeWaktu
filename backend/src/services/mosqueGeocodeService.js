// Mosques module — alternate data source: the existing JAKIM SISMIM/JAIS
// masjid dataset (src/db/database.js, the sqlite `masjid` table already used
// by the unrelated /api/masjid feature — read-only here, never written to).
// That dataset has far better name/address/state/district coverage than OSM
// (26,396 rows vs ~7,400) but carries almost no coordinates (1 row out of
// 26,396 in practice), so each row is geocoded individually via Nominatim
// (OpenStreetMap's own free geocoder) before being upserted into `mosques`.
import crypto from "node:crypto";
import db from "../db/database.js";
import pool from "../db/postgres.js";

const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org/search";
// Nominatim's usage policy caps public use at 1 request/second — this stays
// safely under that, since the request itself also takes real time.
const NOMINATIM_DELAY_MS = Number(process.env.NOMINATIM_DELAY_MS) || 1100;
// Policy also requires a genuine identifying User-Agent (and/or Referer) on
// every request, or Nominatim may block the IP outright.
const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "SeWaktu-Mosque-Geocoder/1.0 (Malaysian prayer-times app; one-time batch geocode of public JAKIM SISMIM/JAIS masjid data)";

const UPSERT_COLUMNS = [
  "source_id", "source", "name", "type", "latitude", "longitude",
  "address", "district", "state", "phone", "website", "country",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** No natural id exists in the CSV-sourced sqlite data, so a stable dedup
 * key is derived from the fields that identify a row — this is what makes
 * re-running this script skip work it already did (see `alreadyGeocoded`). */
function sourceIdFor(row) {
  const key = [row.name, row.address, row.state, row.district]
    .map((v) => (v ?? "").trim().toLowerCase())
    .join("|");
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 40);
}

// JAKIM's `district` column sometimes holds a prayer-time zone label
// ("Zon 3") rather than an actual place name — geocoding noise, not signal.
function isZoneLabel(value) {
  return /^zon\s*\d+$/i.test((value ?? "").trim());
}

// Parenthetical asides measurably hurt Nominatim's match rate — both in
// descriptive names ("MASJID X (MASJID NEGERI PERAK)") and in JAKIM's
// federal-territory state labels ("Kuala Lumpur (FT)", "Putrajaya (FT)").
function stripParens(value) {
  if (!value) return null;
  const stripped = value.replace(/\([^)]*\)/g, "").trim();
  return stripped || null;
}

// Deliberately excludes the mosque/surau name and JAKIM's `district` field.
// Empirically (tested against 30 real rows spanning famous state mosques and
// ordinary local surau) including the name made Nominatim fail outright far
// more often than it helped — it can't find a POI called "SURAU AL-BAKI",
// and apparently won't fall back to just matching the street when a
// property name doesn't resolve. Every single successful match in testing
// came from the address+state form alone; the name never once contributed a
// win. So the query stays name-free to keep this to one request per row
// (~26k rows over ~8h instead of ~16h) rather than an inconclusive
// name-first attempt.
function buildQuery(row) {
  const district = !isZoneLabel(row.district) ? row.district : null;
  return [row.address, district, stripParens(row.state), "Malaysia"].filter(Boolean).join(", ");
}

async function geocodeRow(row) {
  const query = buildQuery(row);
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1", countrycodes: "my" });
  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Nominatim responded with ${res.status}`);
  }
  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;
  const [top] = results;
  return { latitude: Number(top.lat), longitude: Number(top.lon) };
}

async function findExisting(client, source, sourceId) {
  const result = await client.query(
    "SELECT id FROM mosques WHERE source = $1 AND source_id = $2",
    [source, sourceId]
  );
  return result.rows.length > 0;
}

const UPSERT_SQL = `
  INSERT INTO mosques (${UPSERT_COLUMNS.join(", ")})
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  ON CONFLICT (source, source_id) DO UPDATE SET
    name = EXCLUDED.name, type = EXCLUDED.type,
    latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
    address = EXCLUDED.address, district = EXCLUDED.district, state = EXCLUDED.state,
    phone = EXCLUDED.phone, website = EXCLUDED.website, country = EXCLUDED.country
`;

/**
 * Geocodes every row in the sqlite `masjid` table via Nominatim and upserts
 * successfully-geocoded ones into Postgres `mosques`, one row (and one
 * Nominatim request) at a time, rate-limited to Nominatim's policy. Writes
 * happen incrementally rather than in one final transaction — a multi-hour
 * job is safer to interrupt/resume this way, and rows already present
 * (matched by a hash of name/address/state/district) are skipped without a
 * network call, so a re-run only processes what's new or previously failed.
 *
 * Deliberately does not touch existing OSM-sourced rows — see
 * `clearOsmMosques()` for the separate, explicit step that removes them
 * once you're happy with this dataset.
 */
export async function geocodeMasjidDataset({ onProgress, limit } = {}) {
  const rows = Number.isInteger(limit)
    ? db.prepare("SELECT * FROM masjid LIMIT ?").all(limit)
    : db.prepare("SELECT * FROM masjid").all();
  const client = await pool.connect();

  let geocoded = 0;
  let skippedCached = 0;
  let failed = 0;

  try {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const sourceId = sourceIdFor(row);

      // eslint-disable-next-line no-await-in-loop -- intentionally sequential to respect Nominatim's rate limit
      const exists = await findExisting(client, row.source, sourceId);
      if (exists) {
        skippedCached += 1;
        onProgress?.({ index: i + 1, total: rows.length, geocoded, skippedCached, failed });
        continue;
      }

      let coords = null;
      try {
        // eslint-disable-next-line no-await-in-loop
        coords = await geocodeRow(row);
      } catch (error) {
        console.error(`[mosques-geocode] Nominatim error for "${row.name}": ${error.message}`);
      }

      if (coords) {
        // eslint-disable-next-line no-await-in-loop
        await client.query(UPSERT_SQL, [
          sourceId, row.source, row.name, row.kind === "surau" ? "Surau" : "Masjid",
          coords.latitude, coords.longitude,
          row.address, row.district, row.state, row.phone, row.website, "Malaysia",
        ]);
        geocoded += 1;
      } else {
        failed += 1;
      }

      onProgress?.({ index: i + 1, total: rows.length, geocoded, skippedCached, failed });
      // eslint-disable-next-line no-await-in-loop -- the whole point is to pace requests
      await sleep(NOMINATIM_DELAY_MS);
    }
  } finally {
    client.release();
  }

  return { total: rows.length, geocoded, skippedCached, failed };
}

/** Removes OSM-sourced rows — the explicit "make the geocoded SISMIM/JAIS
 * data the replacement" step, kept separate from geocodeMasjidDataset() so a
 * failed/interrupted geocode run never leaves the table empty. */
export async function clearOsmMosques() {
  const result = await pool.query("DELETE FROM mosques WHERE source = 'osm'");
  return result.rowCount;
}
