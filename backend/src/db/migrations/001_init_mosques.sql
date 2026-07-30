-- Mosques module (OpenStreetMap-sourced) — Supabase Postgres + PostGIS.
--
-- This is a brand-new, self-contained schema. It does not touch, replace, or
-- read from the existing sqlite `masjid` table (src/db/database.js) — that
-- feature (SISMIM/JAIS data, /api/masjid routes) keeps running unchanged.
--
-- Run once via: npm run migrate-mosques

CREATE EXTENSION IF NOT EXISTS postgis;
-- Enables fast partial/fuzzy name search (ILIKE '%term%') via a GIN index,
-- which a plain btree index can't accelerate.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS mosques (
  id BIGSERIAL PRIMARY KEY,

  -- OSM's own identifiers. Note: OSM ids are only unique *within* an element
  -- type — a node #123 and a way #123 can both exist — so uniqueness is
  -- enforced on the (osm_type, osm_id) pair below, not on osm_id alone.
  osm_id BIGINT NOT NULL,
  osm_type TEXT NOT NULL DEFAULT 'node' CHECK (osm_type IN ('node', 'way', 'relation')),

  name TEXT,
  type TEXT NOT NULL DEFAULT 'Mosque' CHECK (type IN ('Mosque', 'Masjid', 'Surau')),

  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  -- Kept in sync with latitude/longitude by the trigger below. Used only for
  -- spatial queries (ST_DWithin / distance sort) — plain lat/lng columns stay
  -- the source of truth and what the API actually serializes.
  location GEOGRAPHY(Point, 4326),

  address TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'Malaysia',

  phone TEXT,
  website TEXT,
  operator TEXT,

  source TEXT NOT NULL DEFAULT 'osm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (osm_type, osm_id)
);

CREATE INDEX IF NOT EXISTS idx_mosques_state ON mosques (state);
CREATE INDEX IF NOT EXISTS idx_mosques_district ON mosques (district);
CREATE INDEX IF NOT EXISTS idx_mosques_city ON mosques (city);
CREATE INDEX IF NOT EXISTS idx_mosques_name_trgm ON mosques USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mosques_location ON mosques USING gist (location);

-- Keeps `location` derived from lat/lng, and `updated_at` current, on every
-- write — so callers only ever need to set latitude/longitude directly.
CREATE OR REPLACE FUNCTION mosques_before_write()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mosques_before_write ON mosques;
CREATE TRIGGER trg_mosques_before_write
BEFORE INSERT OR UPDATE ON mosques
FOR EACH ROW
EXECUTE FUNCTION mosques_before_write();

-- Import bookkeeping (last run time, counts) — mirrors the sqlite
-- `dataset_meta` table's purpose, kept separate since it's a different DB.
CREATE TABLE IF NOT EXISTS mosque_sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
