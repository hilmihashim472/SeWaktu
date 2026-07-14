import "dotenv/config";
import app from "./src/app.js";
import { startMasjidSyncSchedule } from "./src/jobs/syncSchedule.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`SeWaktu backend listening on http://localhost:${PORT}`);
  startMasjidSyncSchedule();
});
