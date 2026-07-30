import express from "express";
import cors from "cors";
import morgan from "morgan";
import prayerTimesRouter from "./routes/prayerTimes.js";
import zonesRouter from "./routes/zones.js";
import masjidRouter from "./routes/masjid.js";
import mosquesRouter from "./routes/mosques.js";
import adminRouter from "./routes/admin.js";
import timetableRouter from "./routes/timetable.js";

const app = express();

// Strip a trailing slash so a stray "/" in FRONTEND_ORIGIN (e.g. https://app.vercel.app/)
// doesn't silently break CORS — browsers match Origin exactly, with no normalization.
const frontendOrigin = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

app.use(
  cors({
    origin: frontendOrigin,
  })
);
app.use(morgan("dev"));
// Only needed by POST /api/mosques/submissions and /resolve-location so far
// — every other route in this app is a GET with no body.
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/prayer-times", prayerTimesRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/masjid", masjidRouter);
app.use("/api/mosques", mosquesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/timetable", timetableRouter);

app.use((req, res) => {
  res.status(404).json({ error: "NotFound", message: `No route for ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "InternalServerError", message: "An unexpected error occurred." });
});

export default app;
