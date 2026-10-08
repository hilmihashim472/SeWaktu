import fs from "node:fs";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import healthRouter from "./routes/health.js";
import prayerTimesRouter from "./routes/prayerTimes.js";
import zonesRouter from "./routes/zones.js";
import masjidRouter from "./routes/masjid.js";
import mosquesRouter from "./routes/mosques.js";
import adminRouter from "./routes/admin.js";
import timetableRouter from "./routes/timetable.js";
import serveFrontend from "./frontend.js";

const isProduction = process.env.NODE_ENV === "production";
const app = express();

// Coolify (Traefik) sits in front of the app, so trust one proxy hop for the
// real client IP (rate limiting) and protocol (https in canonical URLs). Set
// TRUST_PROXY=2 if you also put Cloudflare's proxy in front.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Leaflet and React style props set inline styles.
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    // Only the app's own domain — don't force HTTPS onto other subdomains.
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: false },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
app.use((req, res, next) => {
  // Geolocation is used for nearest zone / nearby mosques; motion sensors for the Qiblat compass.
  res.set("Permissions-Policy", "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)");
  next();
});

// Strip a trailing slash so a stray "/" in FRONTEND_ORIGIN (e.g. https://app.vercel.app/)
// doesn't silently break CORS — browsers match Origin exactly, with no normalization.
// Only matters when the frontend is hosted separately; the single Docker image is same-origin.
const frontendOrigin = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

app.use(
  cors({
    origin: frontendOrigin,
  })
);
app.use(compression());
app.use(
  morgan(isProduction ? "combined" : "dev", {
    // Healthchecks hit every 30s — keep them out of the logs.
    skip: (req) => req.path.startsWith("/api/health"),
  })
);
// Only needed by POST /api/mosques/submissions and /resolve-location so far
// — every other route in this app is a GET with no body.
app.use(express.json({ limit: "10kb" }));

const rateLimitDefaults = { standardHeaders: "draft-8", legacyHeaders: false };
const apiLimiter = rateLimit({
  ...rateLimitDefaults,
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE) || 300,
  skip: (req) => req.path.startsWith("/health"),
  message: { error: "TooManyRequests", message: "Too many requests, please slow down." },
});
// Public write endpoints (and resolve-location, which fetches external URLs).
const writeLimiter = rateLimit({
  ...rateLimitDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "TooManyRequests", message: "Too many submissions, please try again later." },
});
const adminLimiter = rateLimit({
  ...rateLimitDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "TooManyRequests", message: "Too many attempts, please try again later." },
});

app.use("/api", apiLimiter);
app.post(["/api/mosques/submissions", "/api/mosques/resolve-location"], writeLimiter);
app.use("/api/admin", adminLimiter);

app.use("/api/health", healthRouter);
app.use("/api/prayer-times", prayerTimesRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/masjid", masjidRouter);
app.use("/api/mosques", mosquesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/timetable", timetableRouter);

// In the single-image Docker deploy, the built frontend is served from here too.
const frontendDist = process.env.FRONTEND_DIST;
if (frontendDist && fs.existsSync(frontendDist)) {
  serveFrontend(app, frontendDist);
}

app.use((req, res) => {
  res.status(404).json({ error: "NotFound", message: `No route for ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Client errors from middleware (malformed JSON, body too large) keep their status.
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: "BadRequest", message: err.expose ? err.message : "Bad request." });
  }
  console.error(err);
  res.status(500).json({ error: "InternalServerError", message: "An unexpected error occurred." });
});

export default app;
