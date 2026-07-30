# SeWaktu Backend

Express.js API that serves Malaysian Islamic prayer times ("Waktu Solat") by JAKIM zone.

## Routes

- `GET /api/prayer-times/:zone` — today's normalized prayer times for a JAKIM zone code (e.g. `WLY01`).
- `GET /api/zones` — the full JAKIM zone list, grouped by state.
- `GET /api/health` — health check, returns `{ "status": "ok" }`.
- `GET /api/masjid` — paginated masjid/surau directory. See [Masjid directory](#masjid-directory).
- `GET /api/masjid/states` — distinct `state` values with row counts, for filter UIs.
- `GET /api/masjid/districts?state=X` — distinct `district` values (+ counts) within a state.
- `GET /api/masjid/:id` — a single masjid/surau record.
- `POST /api/admin/sync-masjid-data` — admin-only, forces a re-sync. See [Manual sync](#manual-sync).
- `GET /api/timetable/:zone` — a full month of upcoming prayer times. See [Monthly timetable](#monthly-timetable).

## Data source chain

For each request, `src/services/prayerTimeService.js` resolves prayer times in this order:

1. **JAKIM e-Solat API** (primary) — called server-to-server, so no CORS restriction applies:
   `GET https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone={ZONE}&period=today`
2. **Aladhan API** (fallback) — used automatically if JAKIM times out, returns a non-200 status,
   or responds with an unexpected shape:
   `GET https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude={lat}&longitude={lng}&method=17`
   Coordinates come from `src/data/zoneCoordinates.js`, which maps each JAKIM zone to an
   approximate lat/lng (defaulting to Kuala Lumpur if a zone isn't mapped). `method=17` selects
   JAKIM's own calculation method so fallback results stay consistent with the primary source.

Both shapes are normalized to the same response before being sent to the client:

```json
{
  "source": "jakim",
  "zone": "WLY01",
  "date": "14-Jul-2026",
  "day": "Tuesday",
  "hijri": "1447-01-29",
  "timings": {
    "imsak": "05:52",
    "fajr": "06:02",
    "syuruk": "07:15",
    "dhuhr": "13:19",
    "asr": "16:43",
    "maghrib": "19:20",
    "isha": "20:33"
  },
  "cachedAt": "2026-07-14T00:03:00+08:00"
}
```

`source` is `"jakim"` or `"aladhan-fallback"` depending on which upstream produced the data.

If **both** upstreams fail, the route responds `502 Bad Request` with a JSON error body instead
of crashing the server:

```json
{
  "error": "UpstreamUnavailable",
  "message": "Unable to retrieve prayer times for zone \"WLY01\" from JAKIM or Aladhan.",
  "detail": "..."
}
```

## Caching

Prayer times only change once a day, so `src/services/cacheService.js` keeps a simple in-memory
`Map` keyed by `${zone}-${date}`, where `date` is today's date in the `Asia/Kuala_Lumpur` timezone
(`YYYY-MM-DD`). Every request first checks this cache; only a miss triggers a call to JAKIM/Aladhan.
Because the key includes the Kuala Lumpur calendar date, the cache "invalidates" automatically at
midnight local time — the next request simply produces a new key and repopulates the cache. There
is no background timer or manual eviction.

## Monthly timetable

`GET /api/timetable/:zone?month=7&year=2026` returns a full month of prayer times as an array of
day objects. It's **upcoming-only by design** — `month`/`year` default to the current Kuala Lumpur
calendar month, and requesting anything already fully in the past returns `400 PastMonth`.
Requests more than 12 months ahead return `400 TooFarAhead`, since neither upstream reliably has
data that far out. An unknown zone code returns `400 InvalidZone`, and an out-of-range `month`
(outside 1–12) or non-integer `year` returns `400 InvalidMonth`/`400 InvalidYear`.

```json
{
  "zone": "WLY01",
  "month": 7,
  "year": 2026,
  "source": "jakim",
  "days": [
    {
      "date": "15-Jul-2026",
      "day": "Wednesday",
      "hijri": "1447-01-30",
      "timings": {
        "imsak": "05:52", "fajr": "06:02", "syuruk": "07:15", "dhuhr": "13:19",
        "asr": "16:43", "maghrib": "19:20", "isha": "20:33"
      }
    }
  ]
}
```

**The JAKIM `period=month` quirk:** JAKIM's `period=month` endpoint always returns the *current*
month server-side, ignoring any date you'd otherwise pass — there's no way to ask it for a
specific future month. So `fetchMonthlyTimings()` in `src/services/prayerTimeService.js` only
calls JAKIM when the requested month **is** the current one (with the same JAKIM → Aladhan
fallback as the daily endpoint if that call fails). Any other requested month skips JAKIM
entirely and goes straight to Aladhan's calendar endpoint
(`GET https://api.aladhan.com/v1/calendar/{year}/{month}?latitude={lat}&longitude={lng}&method=17`),
which does support arbitrary months.

**Caching:** a given zone/month/year's timings never change once published, so
`getCachedMonth`/`setCachedMonth` (in `src/services/cacheService.js`, a separate `Map` from the
daily cache) cache the whole response indefinitely — for the entire month, not just "today" —
until the process restarts.

## Masjid directory

`GET /api/masjid` and `GET /api/masjid/:id` serve a local SQLite copy of the
[abualif120/malaysia-masjid-dataset](https://github.com/abualif120/malaysia-masjid-dataset)
(masjid + surau records scraped from JAKIM SISMIM, plus richer JAIS detail for Selangor),
licensed **CC BY 4.0**.

`GET /api/masjid` query params:

| Param | Description |
| --- | --- |
| `state` | Exact match on state name (e.g. `Selangor`) |
| `district` | Exact match on district name |
| `kind` | `masjid` or `surau` |
| `q` | Case-insensitive substring match on name |
| `page` | Page number, default `1` |
| `limit` | Rows per page, default `50`, max `200` |

Response shape:

```json
{
  "data": [{ "id": 1, "name": "MASJID NEGARA", "kind": "masjid", "state": "Kuala Lumpur (FT)", ... }],
  "pagination": { "page": 1, "limit": 50, "total": 26396, "totalPages": 528 }
}
```

### How the sync works

`src/services/masjidSyncService.js` keeps the local `masjid` table in sync with the dataset's
`data/` folder without any formal versioning — the dataset has none, so freshness is detected
purely by watching the latest GitHub commit SHA that touched that folder:

1. `checkForUpdates()` calls the GitHub commits API for `data/` and compares the newest SHA
   against the `last_commit_sha` value stored in the local `dataset_meta` table. The very first
   run has no stored SHA, so it always counts as "has update".
2. If there's an update, `syncDataset()` downloads `masjid.csv`, `surau.csv`, and
   `selangor_detail.csv` from `raw.githubusercontent.com`, parses them, and normalizes all three
   into the shared `masjid` table shape (`masjid.csv`/`surau.csv` → `source: "sismim"`,
   `selangor_detail.csv` → `source: "jais"`, with the extra `category`/`email`/`website`/
   `capacity`/`latitude`/`longitude` fields it uniquely provides — note most JAIS
   latitude/longitude values are empty, per the upstream dataset's own documented limitation).
3. Downloading and parsing happen **before** any database write. Only once everything parses
   cleanly does it open a transaction that deletes the existing rows, bulk-inserts the new ones,
   and updates `dataset_meta`. If anything fails at any point — download, parse, or insert — the
   transaction rolls back (or never starts) and the previously synced data is left untouched.

### Schedule

A `node-cron` job (`src/jobs/syncSchedule.js`) runs `checkForUpdates()` once daily at **3am
Asia/Kuala_Lumpur** and only calls `syncDataset()` if an update is found. Every run — including
no-op checks — logs a timestamped line, so the audit trail lives in the server logs. This is
started automatically when `server.js` boots.

GitHub's unauthenticated API rate limit is 60 requests/hour; this job calls it once a day, and
every call logs the `X-RateLimit-Remaining` response header for visibility.

### Manual sync

```bash
curl -X POST http://localhost:3000/api/admin/sync-masjid-data \
  -H "X-Admin-Token: $ADMIN_SYNC_TOKEN"
```

Forces an immediate re-sync (regardless of whether `checkForUpdates()` would report a change) and
returns the sync summary as JSON — useful right after a deploy or for testing. Requires the
`X-Admin-Token` header to match the `ADMIN_SYNC_TOKEN` env var; requests without it (or with the
wrong value) get `401`, and the route itself returns `503` if the server has no token configured.

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port the server listens on | `3000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `REQUEST_TIMEOUT_MS` | Timeout for outbound JAKIM/Aladhan requests | `8000` |
| `ADMIN_SYNC_TOKEN` | Shared secret required in `X-Admin-Token` to call the manual sync route | none — route returns `503` until set |
| `DATABASE_PATH` | Absolute path for the masjid SQLite file — point this at a persistent volume in production, since app code is redeployed fresh on every deploy | `src/db/masjid.sqlite3` |

## Running

```bash
npm install

# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:<PORT>` (default `3000`). The masjid dataset starts empty
until the first successful sync — either wait for the 3am cron run or trigger one manually (see
above). The SQLite file lives at `src/db/masjid.sqlite3` and is gitignored; it's rebuilt from
scratch on first sync.

## Mosques Module (OpenStreetMap)

A second, fully independent mosque/masjid/surau directory sourced from OpenStreetMap, stored in
Supabase Postgres with PostGIS. This does **not** replace the SISMIM/JAIS-based `masjid`
feature documented above — it's a parallel system living under `/api/mosques`, its own database,
its own sync mechanism. Built out in stages; this section grows as each stage lands.

### Why Postgres via `pg`, not the Supabase SDK

Supabase's database is just Postgres — reachable over a normal connection string. The rest of
this backend talks to its database with raw parameterized SQL (via `better-sqlite3`, no ORM), so
`pg` (`src/db/postgres.js`) keeps that same style. The `@supabase/supabase-js` SDK is aimed at
browser/edge use (RLS, realtime, storage, auth) — none of which this feature needs.

### Setup

1. Create a Supabase project (or use an existing one).
2. Copy its Postgres connection string (**Settings → Database → Connection string → URI**) into
   `backend/.env` as `DATABASE_URL` (see `.env.example`).
3. Run the migration once:
   ```bash
   npm run migrate-mosques
   ```
   This enables the `postgis` and `pg_trgm` extensions and creates the `mosques` table (see
   `src/db/migrations/001_init_mosques.sql`). Safe to re-run — every statement is
   `CREATE ... IF NOT EXISTS` / `OR REPLACE`.

### Schema

`mosques` — one row per OpenStreetMap place of worship:

| Column | Notes |
| --- | --- |
| `source`, `source_id` | Together unique — the dedup/upsert key for **any** source. For OSM rows, `source_id` is `${osm_type}:${osm_id}` (OSM ids repeat across node/way/relation, so identity there is the pair, not `osm_id` alone). For the geocoded SISMIM/JAIS source (see below), there's no natural id, so `source_id` is a hash of name+address+state+district instead |
| `osm_id`, `osm_type` | Nullable — only populated for OSM-sourced rows (used for the "Open in OpenStreetMap" link) |
| `name`, `type` (`Mosque`/`Masjid`/`Surau`) | |
| `latitude`, `longitude` | Source of truth; the API reads these directly |
| `location` | `geography(Point, 4326)`, auto-populated from lat/lng by a trigger — used only for spatial queries (nearby search, distance sort), never written to directly |
| `address`, `city`, `district`, `state`, `postcode`, `country` | |
| `phone`, `website`, `operator` | |
| `source` | `"osm"` or `"sismim"`/`"jais"` depending which import populated the row (see `src/db/migrations/002_generalize_source_id.sql`) |

`mosque_sync_meta` — key/value bookkeeping for the import script (last run time, row counts),
mirroring what `dataset_meta` does for the sqlite masjid sync.

### Import

```bash
npm run import-mosques
```

Queries the [Overpass API](https://overpass-api.de) — a live query service over OpenStreetMap
data — for every element in Malaysia tagged `amenity=place_of_worship`+`religion=muslim` or
`building=mosque` (`src/services/mosqueSyncService.js`), then upserts them into `mosques`, keyed
on `(osm_type, osm_id)`: new elements are inserted, previously-imported ones are refreshed with
the latest tags. Nothing is ever deleted — a mosque that disappears from OSM is left in the table
rather than silently dropped.

This hits a live third-party API rather than a downloaded extract, so run it manually or on a
schedule you control (e.g. weekly cron) — there's no automatic scheduling wired up yet, unlike
the masjid sync's cron job. Be considerate of Overpass's public rate limits; `OVERPASS_API_URL`
can point at a different mirror if needed (see `.env.example`).

OSM has no tag distinguishing "masjid" from "surau" the way JAKIM's dataset does, so `type` is
inferred from the name (containing "surau" / "masjid" / neither → generic "Mosque") — a
best-effort heuristic, not authoritative.

**`state` backfill:** OSM's `addr:state` tag is populated on well under 1% of Malaysian mosques
in practice. Where it's missing, `state` is instead derived by matching the mosque's coordinates
to the nearest JAKIM prayer-time zone (reusing `findNearestZone` from the existing zones feature)
and reading that zone's known state — see `deriveState()` in `mosqueSyncService.js`. This gets
`state` to ~100% coverage; `district` has no equivalent backfill and stays OSM-only (sparse).

### Alternate source: geocoded SISMIM/JAIS data

```bash
npm run geocode-mosques          # full run — all rows, ~8h+ against Nominatim's rate limit
npm run geocode-mosques -- --limit=50   # test run — first 50 rows only, doesn't touch OSM data
```

The **currently active** data source for `mosques` (as of the last run of this script) — this
takes the sqlite `masjid` table's own SISMIM/JAIS data (`src/db/database.js`, read-only here,
completely separate from the unrelated `/api/masjid` feature that owns it) and geocodes each row
individually via [Nominatim](https://nominatim.openstreetmap.org) (OSM's own free geocoder),
since that dataset has far better name/address/state/district coverage than OSM's own tags
(26,396 rows vs OSM's ~7,400) but carries almost no coordinates on its own.

**Real-world result of the last full run:** 26,396 rows in, **7,160 geocoded** successfully
(27.1%) — lower than a small pre-run sample suggested, since a large share of entries are
informally-addressed rural surau ("Kg X, Mukim Y" style, or literally a PO box) that Nominatim
can't resolve. Rows that fail to geocode are **excluded from `mosques` entirely** (no
coordinates, so they can't appear on the map or in nearby search) — the geocoded SISMIM/JAIS set
ends up close in size to the OSM set it replaced (7,160 vs 7,409), not a large net gain, but
`district` coverage jumps from ~0.6% (OSM) to ~99% and most rows carry a genuine JAKIM-sourced
phone number, which OSM's tags almost never have.

Implementation notes (`src/services/mosqueGeocodeService.js`):
- **One Nominatim request per row**, deliberately *not* including the mosque/surau's own name in
  the query — testing against real rows showed including the name made Nominatim fail far more
  often than it helped (it can't find a POI called "SURAU AL-BAKI" and won't fall back to just
  the street), while address+district+state alone succeeded in every case that succeeded at all.
- Strips JAKIM zone-labels masquerading as districts (`"Zon 3"`) and parenthetical asides in
  state names (`"Kuala Lumpur (FT)"`) before building the query — both measurably hurt matches.
- Writes upsert incrementally (one row at a time), not in one final transaction — safe to
  interrupt an 8-hour run; re-running skips every row already geocoded (matched by a hash of
  name/address/state/district) without spending a Nominatim request on it, so it resumes near
  where it left off.
- Only deletes the old OSM-sourced rows (`clearOsmMosques()`) *after* a full successful pass —
  an interrupted run never leaves the table empty.
- Respects Nominatim's usage policy: paced to under 1 request/second, and sends a real
  identifying `User-Agent` (`NOMINATIM_USER_AGENT` in `.env.example` if you want to customize it).

To switch back to OSM as the source, just run `npm run import-mosques` again — it repopulates
`osm`-sourced rows without touching whatever's currently there from the other source; the two
just coexist in the same table (distinguished by `source`) until you explicitly clear one out.

### API

All endpoints are read-only (`GET`) and live under `/api/mosques`, registered in `src/app.js`
alongside (not replacing) `/api/masjid`.

| Route | Query params | Notes |
| --- | --- | --- |
| `GET /api/mosques` | `page`, `limit` (max 10000), `search`, `state`, `district`, `city`, `type` (`Mosque`\|`Masjid`\|`Surau`), `lat`+`lng`+`radius` (km, default 5, max 50), `sort` (`name` \| `distance` \| `newest`) | `sort=distance` only applies when `lat`/`lng` are given; results include a `distance_km` field in that case |
| `GET /api/mosques/:id` | — | `id` is the internal serial id, not `osm_id` |
| `GET /api/mosques/states` | — | `{ state, count }[]`, cached in-memory for 10 minutes |
| `GET /api/mosques/districts` | `state` (required) | `{ district, count }[]`, cached in-memory for 10 minutes |
| `GET /api/mosques/search` | `q` (required), plus the same `page`/`limit` as above | Thin alias over `GET /api/mosques?search=` — same response shape |

Pagination response shape matches the existing masjid feature exactly:
```json
{ "data": [...], "pagination": { "page": 1, "limit": 50, "total": 7409, "totalPages": 149 } }
```

Example — mosques within 3km of KLCC, nearest first:
```bash
curl "http://localhost:3000/api/mosques?lat=3.1579&lng=101.7116&radius=3&sort=distance&limit=5"
```

### Contributions ("this mosque isn't listed yet")

Two `POST` endpoints — the only write/JSON-body routes in this backend, which is why
`express.json({ limit: "10kb" })` is now in `src/app.js`.

| Route | Body | Notes |
| --- | --- | --- |
| `POST /api/mosques/resolve-location` | `{ "url": "<google maps link>" }` | Returns `{ latitude, longitude }` or `422 UnresolvableUrl`. Only accepts `google.com`/`goo.gl` hostnames (rejects anything else outright, so this can't be used as an open URL-fetching proxy) |
| `POST /api/mosques/submissions` | `{ name, type?, address?, latitude, longitude, mapsUrl?, phone?, website?, notes? }` | `name` and a location (`latitude`+`longitude`) are required; everything else is optional. Returns `{ id, status: "pending" }` |

Submissions land in **`mosque_submissions`** (`src/db/migrations/003_create_mosque_submissions.sql`)
— a moderation queue, not a direct write into `mosques`. Nothing submitted through the form
appears on the public map automatically; there's no review UI yet, so approving a submission
today means querying `mosque_submissions WHERE status = 'pending'` directly and copying the row
into `mosques` by hand (and setting `status = 'approved'` on the submission) if it looks good.

**Google Maps link resolution** (`resolveGoogleMapsUrl()` in `src/routes/mosques.js`): "long" URLs
already have coordinates embedded in the path/query and are parsed directly, no request needed.
Shortened links (`maps.app.goo.gl/...`, the common case sharing from a phone) have no coordinates
in the URL itself, so they're fetched **server-side** to follow the redirect — a browser can't do
this itself, since reading the final URL of a cross-origin redirect is blocked by CORS. Verified
against a real long-form `/maps/place/.../@lat,lng,zoom/data=...!3d{lat}!4d{lng}` URL (the format
Google's short links redirect to); **not** verified against an actual live short link end-to-end,
since generating one requires using the Maps app's own share feature — worth a real test once
this is live.
