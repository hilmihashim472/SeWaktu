import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../src/db/postgres.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "src", "db", "migrations");

/** Runs every .sql file in src/db/migrations, in filename order, inside a
 * single transaction. There's no migration-tracking table (yet) — each file
 * is written with CREATE ... IF NOT EXISTS / OR REPLACE, so re-running the
 * whole set is always safe. */
async function migrate() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("[mosques-migrate] No migration files found in", MIGRATIONS_DIR);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`[mosques-migrate] Running ${file}...`);
      await client.query(sql);
    }
    await client.query("COMMIT");
    console.log(`[mosques-migrate] Done — applied ${files.length} migration file(s).`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[mosques-migrate] Failed, rolled back:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => pool.end())
  .catch((error) => {
    pool.end();
    console.error(error);
    process.exit(1);
  });
