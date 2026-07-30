-- User-contributed mosque/surau submissions — a moderation queue, not a
-- direct write path into `mosques`. Nothing here is shown on the public map
-- until someone with database access reviews a row and either copies it into
-- `mosques` (status -> 'approved') or rejects it. There's no admin UI for
-- this yet — review happens via direct SQL for now.

CREATE TABLE IF NOT EXISTS mosque_submissions (
  id BIGSERIAL PRIMARY KEY,

  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Mosque', 'Masjid', 'Surau')),
  address TEXT,

  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- The Google Maps link the contributor pasted in, if any — kept verbatim
  -- alongside the resolved lat/lng so a reviewer can double-check it.
  maps_url TEXT,

  phone TEXT,
  website TEXT,
  notes TEXT,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mosque_submissions_status ON mosque_submissions (status);
