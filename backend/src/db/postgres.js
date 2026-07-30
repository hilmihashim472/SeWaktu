import pg from "pg";

const { Pool } = pg;

// Connection for the mosques (OpenStreetMap) module only — fully separate
// from the sqlite `masjid` feature in src/db/database.js. Backed by Supabase
// Postgres via a plain connection string, no Supabase SDK involved.
//
// Get DATABASE_URL from your Supabase project: Settings -> Database ->
// Connection string (URI). Supabase's connection pooler (port 6543) also
// requires `?sslmode=require`, which ssl:{rejectUnauthorized:false} below
// satisfies for either the pooled or direct connection string.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[mosques] DATABASE_URL is not set — the mosques module will fail on first query. " +
      "See backend/.env.example."
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  // Fired for idle clients that error out in the background (e.g. connection
  // dropped) — must be handled or Node crashes the whole process.
  console.error("[mosques] Unexpected Postgres pool error:", err);
});

export default pool;
