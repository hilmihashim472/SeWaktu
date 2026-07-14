import express from "express";
import cors from "cors";
import morgan from "morgan";
import prayerTimesRouter from "./routes/prayerTimes.js";
import zonesRouter from "./routes/zones.js";
import masjidRouter from "./routes/masjid.js";
import adminRouter from "./routes/admin.js";
import timetableRouter from "./routes/timetable.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/prayer-times", prayerTimesRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/masjid", masjidRouter);
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
