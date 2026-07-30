import { Router } from "express";
import pool from "../db/postgres.js";

const router = Router();
const DEFAULT_LIMIT = 50;
// Higher than the masjid feature's 200-row cap: the map view needs to be able
// to pull the whole country's markers (~7-8k rows) in one request so client-
// side clustering (leaflet.markercluster) can render them all at once,
// rather than paginating markers on a map — pagination stays available for
// callers that want it (e.g. a future list view), just with more headroom.
const MAX_LIMIT = 10000;
const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 50;
const SORT_OPTIONS = new Set(["name", "distance", "newest"]);

const COLUMNS = [
  "id", "osm_id", "osm_type", "name", "type", "latitude", "longitude",
  "address", "city", "district", "state", "postcode", "country",
  "phone", "website", "operator", "source", "created_at", "updated_at",
];

// Small in-memory TTL cache for the aggregate /states and /districts
// endpoints only — their data only changes once per `npm run import-mosques`
// run, so a short cache meaningfully cuts DB load with no real staleness
// risk. The main listing/search/nearby endpoints are left uncached since
// their parameter space is too large for a simple cache to help.
const AGGREGATE_CACHE_TTL_MS = 10 * 60 * 1000;
const aggregateCache = new Map();

async function cached(key, loader) {
  const hit = aggregateCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  aggregateCache.set(key, { value, expiresAt: Date.now() + AGGREGATE_CACHE_TTL_MS });
  return value;
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit, offset: (page - 1) * limit };
}

/** Builds the shared WHERE clause (+ params) and, when `nearby` coordinates
 * are given, the point used for both distance filtering and distance sort —
 * shared between the count query and the data query so both see identical
 * filters. */
function buildFilters(query) {
  const conditions = [];
  const params = [];

  const push = (sql, value) => {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  };

  const search = query.search || query.q;
  if (search) push("name ILIKE ?", `%${search}%`);
  if (query.state) push("state = ?", query.state);
  if (query.district) push("district = ?", query.district);
  if (query.city) push("city = ?", query.city);
  if (query.type) push("type = ?", query.type);

  let point = null;
  const lat = Number.parseFloat(query.lat);
  const lng = Number.parseFloat(query.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const radiusKm = Math.min(
      MAX_RADIUS_KM,
      Math.max(0.1, Number.parseFloat(query.radius) || DEFAULT_RADIUS_KM)
    );
    params.push(lng, lat);
    const pointSql = `ST_SetSRID(ST_MakePoint($${params.length - 1}, $${params.length}), 4326)::geography`;
    point = { sql: pointSql, radiusKm };
    params.push(radiusKm * 1000);
    conditions.push(`ST_DWithin(location, ${pointSql}, $${params.length})`);
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
    point,
  };
}

function buildOrderBy(sort, point, params) {
  const resolved = SORT_OPTIONS.has(sort) ? sort : "name";

  if (resolved === "distance" && point) {
    return `ORDER BY location <-> ${point.sql}`;
  }
  if (resolved === "newest") {
    return "ORDER BY created_at DESC";
  }
  return "ORDER BY name ASC NULLS LAST";
}

async function listMosques(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { whereSql, params, point } = buildFilters(req.query);

    const selectColumns = [...COLUMNS];
    if (point) {
      selectColumns.push(`ST_Distance(location, ${point.sql}) / 1000.0 AS distance_km`);
    }

    const orderSql = buildOrderBy(req.query.sort, point, params);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM mosques ${whereSql}`,
      params
    );
    const total = countResult.rows[0].total;

    const dataParams = [...params, limit, offset];
    const dataResult = await pool.query(
      `SELECT ${selectColumns.join(", ")} FROM mosques ${whereSql}
       ${orderSql} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    next(error);
  }
}

// Supports: page, limit, search, state, district, city, type, nearby (lat &
// lng), radius (km, used with lat/lng), sort (name | distance | newest).
router.get("/", listMosques);

// Alias for GET / with `q` mapped to `search` — kept separate since it's the
// endpoint named in the spec, but intentionally shares one implementation
// rather than duplicating the query-building logic.
router.get("/search", (req, res, next) => {
  if (!req.query.q) {
    return res.status(400).json({ error: "MissingQuery", message: "Query param 'q' is required." });
  }
  req.query.search = req.query.q;
  return listMosques(req, res, next);
});

router.get("/states", async (req, res, next) => {
  try {
    const rows = await cached("states", async () => {
      const result = await pool.query(
        `SELECT state, COUNT(*)::int AS count FROM mosques
         WHERE state IS NOT NULL AND state != ''
         GROUP BY state ORDER BY state ASC`
      );
      return result.rows;
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/districts", async (req, res, next) => {
  const { state } = req.query;
  if (!state) {
    return res.status(400).json({ error: "MissingState", message: "Query param 'state' is required." });
  }

  try {
    const rows = await cached(`districts:${state}`, async () => {
      const result = await pool.query(
        `SELECT district, COUNT(*)::int AS count FROM mosques
         WHERE state = $1 AND district IS NOT NULL AND district != ''
         GROUP BY district ORDER BY district ASC`,
        [state]
      );
      return result.rows;
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

const SUBMISSION_TYPES = new Set(["Mosque", "Masjid", "Surau"]);
const MAPS_URL_ALLOWED_HOSTS = ["google.com", "goo.gl"];
const MAPS_URL_TIMEOUT_MS = 8000;

function toTrimmedOrNull(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || null;
}

/** Pulls a lat/lng pair out of a Google Maps URL or page body. Tries the
 * most precise form first (the actual pin location in the `data=` param),
 * then the map-view-center form, then old-style query params. */
function extractCoords(text) {
  if (!text) return null;

  const pin = text.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (pin) return { latitude: Number(pin[1]), longitude: Number(pin[2]) };

  const center = text.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (center) return { latitude: Number(center[1]), longitude: Number(center[2]) };

  const query = text.match(/[?&](?:q|ll)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (query) return { latitude: Number(query[1]), longitude: Number(query[2]) };

  return null;
}

/**
 * Resolves a Google Maps link to coordinates. "Long" URLs (shared from
 * desktop) already have the coordinates embedded and are parsed directly —
 * no request needed. Shortened links (goo.gl / maps.app.goo.gl, the common
 * case when sharing from a phone) have no coordinates in the URL itself, so
 * they're fetched server-side to follow the redirect: a browser can't do
 * this itself, since reading the final URL of a cross-origin redirect is
 * blocked by CORS.
 *
 * Restricted to Google's own hostnames so this can't be used as a general
 * open URL-fetching proxy (SSRF) — it will refuse anything else outright.
 */
async function resolveGoogleMapsUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const isAllowedHost = MAPS_URL_ALLOWED_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
  );
  if (!isAllowedHost || !/^https?:$/.test(parsed.protocol)) {
    return null;
  }

  const direct = extractCoords(rawUrl);
  if (direct) return direct;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAPS_URL_TIMEOUT_MS);
  try {
    const response = await fetch(rawUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SeWaktuBot/1.0; mosque-submission-form)" },
    });
    const fromFinalUrl = extractCoords(response.url);
    if (fromFinalUrl) return fromFinalUrl;

    const body = await response.text();
    return extractCoords(body);
  } finally {
    clearTimeout(timer);
  }
}

// Used by the "contribute a mosque" form to turn a pasted Google Maps link
// into coordinates before submitting.
router.post("/resolve-location", async (req, res, next) => {
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!url) {
    return res.status(400).json({ error: "MissingUrl", message: "Body field 'url' is required." });
  }

  try {
    const coords = await resolveGoogleMapsUrl(url);
    if (!coords) {
      return res.status(422).json({
        error: "UnresolvableUrl",
        message: "Couldn't find a location in that link. Try pasting the full map link, or enter coordinates manually.",
      });
    }
    res.json(coords);
  } catch (error) {
    next(error);
  }
});

// Public submission intake for "this mosque/surau isn't listed yet" — always
// lands in `mosque_submissions` as 'pending', never written directly into
// `mosques`. There's no review UI yet; approving a submission means copying
// it into `mosques` by hand for now.
router.post("/submissions", async (req, res, next) => {
  const body = req.body ?? {};
  const name = toTrimmedOrNull(body.name, 200);
  if (!name) {
    return res.status(400).json({ error: "MissingName", message: "'name' is required." });
  }

  const latitude = Number.parseFloat(body.latitude);
  const longitude = Number.parseFloat(body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({
      error: "MissingLocation",
      message: "A location is required — paste a Google Maps link or use your current location.",
    });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: "InvalidLocation", message: "Coordinates out of range." });
  }

  const type = SUBMISSION_TYPES.has(body.type) ? body.type : null;

  try {
    const result = await pool.query(
      `INSERT INTO mosque_submissions (name, type, address, latitude, longitude, maps_url, phone, website, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        name,
        type,
        toTrimmedOrNull(body.address, 500),
        latitude,
        longitude,
        toTrimmedOrNull(body.mapsUrl, 500),
        toTrimmedOrNull(body.phone, 50),
        toTrimmedOrNull(body.website, 300),
        toTrimmedOrNull(body.notes, 1000),
      ]
    );
    res.status(201).json({ id: result.rows[0].id, status: "pending" });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "InvalidId", message: "id must be an integer." });
  }

  try {
    const result = await pool.query(
      `SELECT ${COLUMNS.join(", ")} FROM mosques WHERE id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: "NotFound", message: `No mosque found with id ${id}.` });
    }
    res.json(row);
  } catch (error) {
    next(error);
  }
});

export default router;
