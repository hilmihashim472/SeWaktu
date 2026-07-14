import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "masjid.sqlite3");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS masjid (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('masjid', 'surau')),
    address TEXT,
    state TEXT,
    district TEXT,
    phone TEXT,
    fax TEXT,
    category TEXT,
    email TEXT,
    website TEXT,
    capacity TEXT,
    latitude REAL,
    longitude REAL,
    source TEXT NOT NULL CHECK (source IN ('sismim', 'jais')),
    last_synced_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_masjid_state ON masjid(state);
  CREATE INDEX IF NOT EXISTS idx_masjid_district ON masjid(district);
  CREATE INDEX IF NOT EXISTS idx_masjid_kind ON masjid(kind);
  CREATE INDEX IF NOT EXISTS idx_masjid_name ON masjid(name);

  CREATE TABLE IF NOT EXISTS dataset_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
  );
`);

export function getDatasetMeta(key) {
  const row = db.prepare("SELECT value FROM dataset_meta WHERE key = ?").get(key);
  return row?.value ?? null;
}

export function setDatasetMeta(key, value) {
  db.prepare(
    `INSERT INTO dataset_meta (key, value, updated_at) VALUES (@key, @value, @updatedAt)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run({ key, value, updatedAt: new Date().toISOString() });
}

export default db;
