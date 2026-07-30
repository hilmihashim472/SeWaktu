import "dotenv/config";
import pool from "../src/db/postgres.js";
import { geocodeMasjidDataset, clearOsmMosques } from "../src/services/mosqueGeocodeService.js";

// --limit=N restricts to the first N rows and skips clearing OSM data — for
// trying the pipeline out before committing to the full ~8-hour run.
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : undefined;
const isTestRun = Number.isInteger(limit);

const startedAt = Date.now();

geocodeMasjidDataset({
  limit,
  onProgress: ({ index, total, geocoded, skippedCached, failed }) => {
    if (index % 50 === 0 || index === total || isTestRun) {
      const pct = ((index / total) * 100).toFixed(1);
      const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
      console.log(
        `[mosques-geocode] ${index}/${total} (${pct}%) — geocoded=${geocoded} ` +
          `cached=${skippedCached} failed=${failed} — ${elapsedMin} min elapsed`
      );
    }
  },
})
  .then(async (summary) => {
    console.log("[mosques-geocode] geocoding pass complete:", summary);
    if (isTestRun) {
      console.log("[mosques-geocode] test run (--limit) — leaving OSM data in place, skipping clearOsmMosques().");
      await pool.end();
      return;
    }
    const removed = await clearOsmMosques();
    console.log(
      `[mosques-geocode] removed ${removed} old OSM-sourced row(s) — geocoded SISMIM/JAIS data is now the mosques source.`
    );
    console.log(`[mosques-geocode] total duration: ${((Date.now() - startedAt) / 60000).toFixed(1)} min`);
    await pool.end();
  })
  .catch(async (error) => {
    console.error("[mosques-geocode] fatal error (existing data left untouched):", error);
    await pool.end();
    process.exit(1);
  });
