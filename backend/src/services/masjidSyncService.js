// Dataset: abualif120/malaysia-masjid-dataset
// https://github.com/abualif120/malaysia-masjid-dataset — licensed CC BY 4.0.
// Scraped from JAKIM SISMIM (masjid.csv, surau.csv) and JAIS (selangor_detail.csv).
import { parse } from "csv-parse/sync";
import db, { getDatasetMeta, setDatasetMeta } from "../db/database.js";

const REPO = "abualif120/malaysia-masjid-dataset";
const COMMITS_API_URL = `https://api.github.com/repos/${REPO}/commits?path=data&per_page=1`;
const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO}/main/data`;
const CSV_URLS = {
  masjid: `${RAW_BASE_URL}/masjid.csv`,
  surau: `${RAW_BASE_URL}/surau.csv`,
  selangor_detail: `${RAW_BASE_URL}/selangor_detail.csv`,
};

const GITHUB_API_HEADERS = {
  "User-Agent": "sewaktu-backend-masjid-sync",
  Accept: "application/vnd.github+json",
};

const LAST_COMMIT_SHA_KEY = "last_commit_sha";
const LAST_SYNCED_AT_KEY = "last_synced_at";

function toNullableString(value) {
  const trimmed = (value ?? "").toString().trim();
  return trimmed === "" ? null : trimmed;
}

function toNullableFloat(value) {
  const str = toNullableString(value);
  if (str === null) return null;
  const num = Number.parseFloat(str);
  return Number.isFinite(num) ? num : null;
}

/** masjid.csv / surau.csv rows: name,address,state,district,phone,fax */
function normalizeSismimRow(row, kind, syncedAt) {
  return {
    name: toNullableString(row.name),
    kind,
    address: toNullableString(row.address),
    state: toNullableString(row.state),
    district: toNullableString(row.district),
    phone: toNullableString(row.phone),
    fax: toNullableString(row.fax),
    category: null,
    email: null,
    website: null,
    capacity: null,
    latitude: null,
    longitude: null,
    source: "sismim",
    last_synced_at: syncedAt,
  };
}

/** selangor_detail.csv rows are Selangor-only and carry no `state` column. */
function normalizeJaisRow(row, syncedAt) {
  return {
    name: toNullableString(row.name),
    kind: "masjid",
    address: toNullableString(row.address),
    state: "Selangor",
    district: toNullableString(row.district),
    phone: toNullableString(row.phone),
    fax: toNullableString(row.fax),
    category: toNullableString(row.category),
    email: toNullableString(row.email),
    website: toNullableString(row.website),
    capacity: toNullableString(row.capacity),
    latitude: toNullableFloat(row.latitude),
    longitude: toNullableFloat(row.longitude),
    source: "jais",
    last_synced_at: syncedAt,
  };
}

async function fetchLatestCommitSha() {
  const res = await fetch(COMMITS_API_URL, { headers: GITHUB_API_HEADERS });
  console.log(
    `[masjid-sync] GitHub API rate limit remaining: ${res.headers.get("x-ratelimit-remaining") ?? "unknown"}`
  );
  if (!res.ok) {
    throw new Error(`GitHub commits API responded with ${res.status}`);
  }
  const commits = await res.json();
  if (!Array.isArray(commits) || commits.length === 0) {
    throw new Error("GitHub commits API returned no commits for data/");
  }
  return commits[0].sha;
}

async function downloadCsv(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  return res.text();
}

function parseCsv(text) {
  return parse(text, { columns: true, skip_empty_lines: true, trim: true });
}

/** Compares the latest upstream commit touching data/ against what's stored locally. */
export async function checkForUpdates() {
  const latestSha = await fetchLatestCommitSha();
  const storedSha = getDatasetMeta(LAST_COMMIT_SHA_KEY);
  return { hasUpdate: storedSha !== latestSha, latestSha, storedSha };
}

const insertMasjid = db.prepare(`
  INSERT INTO masjid (
    name, kind, address, state, district, phone, fax,
    category, email, website, capacity, latitude, longitude, source, last_synced_at
  ) VALUES (
    @name, @kind, @address, @state, @district, @phone, @fax,
    @category, @email, @website, @capacity, @latitude, @longitude, @source, @last_synced_at
  )
`);

const reseed = db.transaction((rows, latestSha, syncedAt) => {
  db.prepare("DELETE FROM masjid").run();
  for (const row of rows) insertMasjid.run(row);
  setDatasetMeta(LAST_COMMIT_SHA_KEY, latestSha);
  setDatasetMeta(LAST_SYNCED_AT_KEY, syncedAt);
});

/**
 * Downloads and re-seeds the masjid/surau dataset. Download + parse happen
 * before any database write, and the delete+insert run inside a single
 * transaction — so a failure at any point leaves existing data untouched.
 */
export async function syncDataset({ latestSha } = {}) {
  const startedAt = Date.now();
  const previousSha = getDatasetMeta(LAST_COMMIT_SHA_KEY);

  try {
    const sha = latestSha ?? (await fetchLatestCommitSha());

    const [masjidCsv, surauCsv, selangorCsv] = await Promise.all([
      downloadCsv(CSV_URLS.masjid),
      downloadCsv(CSV_URLS.surau),
      downloadCsv(CSV_URLS.selangor_detail),
    ]);

    const syncedAt = new Date().toISOString();
    const masjidRows = parseCsv(masjidCsv).map((row) => normalizeSismimRow(row, "masjid", syncedAt));
    const surauRows = parseCsv(surauCsv).map((row) => normalizeSismimRow(row, "surau", syncedAt));
    const selangorRows = parseCsv(selangorCsv).map((row) => normalizeJaisRow(row, syncedAt));
    const allRows = [...masjidRows, ...surauRows, ...selangorRows];

    reseed(allRows, sha, syncedAt);

    const durationMs = Date.now() - startedAt;
    const counts = {
      masjid: masjidRows.length,
      surau: surauRows.length,
      selangor_detail: selangorRows.length,
      total: allRows.length,
    };

    console.log(
      `[masjid-sync] synced ${counts.total} rows (masjid=${counts.masjid}, surau=${counts.surau}, ` +
        `selangor_detail=${counts.selangor_detail}) sha ${previousSha ?? "none"} -> ${sha} in ${durationMs}ms`
    );

    return { success: true, previousSha, newSha: sha, counts, durationMs, syncedAt };
  } catch (error) {
    console.error(`[masjid-sync] sync failed, existing data left untouched: ${error.message}`);
    throw error;
  }
}
