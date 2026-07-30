import "dotenv/config";
import pool from "../src/db/postgres.js";
import { importMosques } from "../src/services/mosqueSyncService.js";

importMosques()
  .then((summary) => {
    console.log("[mosques-import] summary:", summary);
    return pool.end();
  })
  .catch((error) => {
    console.error("[mosques-import] error:", error);
    return pool.end().finally(() => process.exit(1));
  });
