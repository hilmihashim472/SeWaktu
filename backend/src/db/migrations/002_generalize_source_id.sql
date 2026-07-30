-- Generalizes `mosques` beyond OSM-only data. Originally every row was
-- required to carry an osm_id/osm_type pair for uniqueness; this adds a
-- source-agnostic `source_id` so other sources (e.g. a geocoded SISMIM/JAIS
-- import, which has no OSM id at all) can upsert safely too.
--
-- Safe to re-run: every statement either no-ops if already applied, or is
-- guarded by an existence check.

-- osm_id/osm_type are now optional — only OSM-sourced rows have them. The
-- old default of 'node' is dropped too: it would otherwise silently mislabel
-- a non-OSM row (e.g. a geocoded SISMIM/JAIS import) as an OSM node.
ALTER TABLE mosques ALTER COLUMN osm_id DROP NOT NULL;
ALTER TABLE mosques ALTER COLUMN osm_type DROP NOT NULL;
ALTER TABLE mosques ALTER COLUMN osm_type DROP DEFAULT;

ALTER TABLE mosques ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Backfill source_id for any existing OSM-sourced rows before requiring it,
-- so this doesn't fail on a table that already has data.
UPDATE mosques
SET source_id = osm_type || ':' || osm_id
WHERE source_id IS NULL AND osm_id IS NOT NULL AND osm_type IS NOT NULL;

ALTER TABLE mosques ALTER COLUMN source_id SET NOT NULL;

ALTER TABLE mosques DROP CONSTRAINT IF EXISTS mosques_osm_type_osm_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mosques_source_source_id_key'
  ) THEN
    ALTER TABLE mosques ADD CONSTRAINT mosques_source_source_id_key UNIQUE (source, source_id);
  END IF;
END $$;
