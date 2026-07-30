// Mosques module — data source: OpenStreetMap, queried live via the Overpass
// API (https://overpass-api.de) rather than a downloaded planet/country
// extract, since that avoids needing native tools (osmium/GDAL) alongside a
// plain Node backend. Scoped to Malaysia via OSM's own country boundary
// relation, matching amenity=place_of_worship+religion=muslim or
// building=mosque — see OVERPASS_QUERY below.
import pool from "../db/postgres.js";
import { findNearestZone } from "../data/zoneCoordinates.js";
import { getStateForZoneCode } from "../data/zones.js";

const OVERPASS_URL = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_TIMEOUT_MS = Number(process.env.OVERPASS_TIMEOUT_MS) || 180000;
const UPSERT_CHUNK_SIZE = 500;

const OVERPASS_QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="MY"][admin_level=2]->.my;
(
  nwr["amenity"="place_of_worship"]["religion"="muslim"](area.my);
  nwr["building"="mosque"](area.my);
);
out body center;
`;

const LAST_IMPORT_AT_KEY = "last_import_at";
const LAST_IMPORT_SUMMARY_KEY = "last_import_summary";

const UPSERT_COLUMNS = [
  "source_id", "osm_id", "osm_type", "name", "type", "latitude", "longitude",
  "address", "city", "district", "state", "postcode", "country",
  "phone", "website", "operator",
];

function toNullableString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

/** OSM has no "masjid vs surau" tag — infer from the name using the same two
 * Malay terms JAKIM's own dataset distinguishes, defaulting to the generic
 * English term when neither appears (common for minimally-tagged entries). */
function deriveType(name) {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("surau")) return "Surau";
  if (lower.includes("masjid")) return "Masjid";
  return "Mosque";
}

/** OSM's Malaysia coverage for addr:state is extremely sparse (~0.3% of
 * mosques in practice) — where it's missing, derive it from the nearest
 * JAKIM prayer-time zone's known state instead, reusing the same
 * zone-coordinate data and haversine matching already used for prayer-time
 * zone detection elsewhere in this app. addr:state is trusted as-is when
 * present since it already matches that same state-naming convention. */
function deriveState(tags, latitude, longitude) {
  const tagged = toNullableString(tags["addr:state"]);
  if (tagged) return tagged;
  const { zone } = findNearestZone(latitude, longitude);
  return getStateForZoneCode(zone);
}

function buildAddress(tags) {
  if (tags["addr:full"]) return toNullableString(tags["addr:full"]);
  const parts = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/** Normalizes one Overpass element into a `mosques` row, or null if it has no
 * usable coordinate — can happen for a way/relation Overpass couldn't
 * compute a center for (`out center` failing on an incomplete geometry). */
function normalizeElement(element) {
  const tags = element.tags || {};
  const latitude = element.lat ?? element.center?.lat ?? null;
  const longitude = element.lon ?? element.center?.lon ?? null;
  if (latitude === null || longitude === null) return null;

  const name = toNullableString(tags.name || tags["name:en"] || tags["name:ms"]);

  return {
    source_id: `${element.type}:${element.id}`,
    osm_id: element.id,
    osm_type: element.type,
    name,
    type: deriveType(name),
    latitude,
    longitude,
    address: buildAddress(tags),
    city: toNullableString(tags["addr:city"]),
    district: toNullableString(tags["addr:district"]),
    state: deriveState(tags, latitude, longitude),
    postcode: toNullableString(tags["addr:postcode"]),
    // Every result is inside Malaysia's own OSM boundary by construction of
    // the query area, so this is fixed rather than read off an inconsistent
    // addr:country tag (which sometimes holds "MY", sometimes "Malaysia").
    country: "Malaysia",
    phone: toNullableString(tags.phone || tags["contact:phone"]),
    website: toNullableString(tags.website || tags["contact:website"]),
    operator: toNullableString(tags.operator),
  };
}

async function fetchOverpassElements() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      // Overpass's Apache front-end 406s requests missing a normal Accept
      // header or with Node's default User-Agent — both are required.
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        "User-Agent": "sewaktu-backend-mosques-import",
      },
      body: OVERPASS_QUERY,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Overpass API responded with ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    return Array.isArray(data.elements) ? data.elements : [];
  } finally {
    clearTimeout(timer);
  }
}

/** Builds a single multi-row `INSERT ... ON CONFLICT DO UPDATE` for a chunk
 * of rows, so a full import round-trips the database far less than one
 * query per row would. `RETURNING (xmax = 0) AS inserted` is the standard
 * Postgres trick for telling apart the insert vs. update path per row. */
function buildUpsertQuery(rows) {
  const values = [];
  const tuples = rows.map((row, i) => {
    const base = i * UPSERT_COLUMNS.length;
    values.push(...UPSERT_COLUMNS.map((col) => row[col]));
    const placeholders = UPSERT_COLUMNS.map((_, j) => `$${base + j + 1}`).join(", ");
    return `(${placeholders}, 'osm')`;
  });

  const updateSet = UPSERT_COLUMNS.filter((c) => c !== "source_id")
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(",\n      ");

  const sql = `
    INSERT INTO mosques (${UPSERT_COLUMNS.join(", ")}, source)
    VALUES ${tuples.join(",\n           ")}
    ON CONFLICT (source, source_id) DO UPDATE SET
      ${updateSet}
    RETURNING (xmax = 0) AS inserted
  `;
  return { sql, values };
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

async function setMeta(client, key, value) {
  await client.query(
    `INSERT INTO mosque_sync_meta (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [key, value]
  );
}

/**
 * Downloads every Muslim place of worship in Malaysia from OpenStreetMap and
 * upserts them into `mosques`, keyed on (source, source_id) where source_id
 * is `${osm_type}:${osm_id}` — matching rows are refreshed with the latest
 * tags, new ones are inserted. Rows are never deleted here: a mosque that
 * disappears from OSM (demolished, re-tagged, etc.) is left in the table
 * rather than silently dropped.
 */
export async function importMosques() {
  const startedAt = Date.now();
  console.log("[mosques-import] Querying Overpass API for Malaysia...");
  const elements = await fetchOverpassElements();
  console.log(`[mosques-import] Overpass returned ${elements.length} element(s).`);

  const seen = new Set();
  const rows = [];
  let skippedNoCoords = 0;

  for (const element of elements) {
    const key = `${element.type}/${element.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const row = normalizeElement(element);
    if (!row) {
      skippedNoCoords += 1;
      continue;
    }
    rows.push(row);
  }

  let inserted = 0;
  let updated = 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const rowChunk of chunk(rows, UPSERT_CHUNK_SIZE)) {
      const { sql, values } = buildUpsertQuery(rowChunk);
      const result = await client.query(sql, values);
      for (const r of result.rows) {
        if (r.inserted) inserted += 1;
        else updated += 1;
      }
    }

    const finishedAt = new Date().toISOString();
    const summary = { fetched: elements.length, processed: rows.length, inserted, updated, skippedNoCoords };
    await setMeta(client, LAST_IMPORT_AT_KEY, finishedAt);
    await setMeta(client, LAST_IMPORT_SUMMARY_KEY, JSON.stringify(summary));

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`[mosques-import] failed, transaction rolled back: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }

  const durationMs = Date.now() - startedAt;
  console.log(
    `[mosques-import] done: fetched=${elements.length} inserted=${inserted} updated=${updated} ` +
      `skipped(no coords)=${skippedNoCoords} in ${durationMs}ms`
  );
  return { fetched: elements.length, processed: rows.length, inserted, updated, skippedNoCoords, durationMs };
}
