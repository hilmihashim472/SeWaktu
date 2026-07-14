import cron from "node-cron";
import { checkForUpdates, syncDataset } from "../services/masjidSyncService.js";

const CRON_SCHEDULE = "0 3 * * *"; // 3am Asia/Kuala_Lumpur, daily

async function runScheduledCheck() {
  const timestamp = new Date().toISOString();
  try {
    const { hasUpdate, latestSha } = await checkForUpdates();
    if (!hasUpdate) {
      console.log(`[masjid-sync] ${timestamp} scheduled check — no update (sha ${latestSha})`);
      return;
    }
    console.log(`[masjid-sync] ${timestamp} scheduled check — update found (sha ${latestSha}), syncing...`);
    await syncDataset({ latestSha });
  } catch (error) {
    console.error(`[masjid-sync] ${timestamp} scheduled check failed: ${error.message}`);
  }
}

export function startMasjidSyncSchedule() {
  cron.schedule(CRON_SCHEDULE, runScheduledCheck, { timezone: "Asia/Kuala_Lumpur" });
  console.log(`[masjid-sync] scheduled daily check at "${CRON_SCHEDULE}" (Asia/Kuala_Lumpur)`);
}
