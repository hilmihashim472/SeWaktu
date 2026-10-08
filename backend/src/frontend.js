import fs from "node:fs";
import path from "node:path";
import express from "express";
import pool from "./db/postgres.js";

// Client-side routes defined in frontend/src/App.jsx. Anything else gets the
// app's 404 page *with* a real 404 status, so search engines don't index junk
// URLs as duplicates of the homepage.
const SPA_ROUTE = /^\/(?:mosques(?:\/\d+)?|timetable|qiblat|settings)?\/?$/;

const STATIC_PAGES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/timetable", changefreq: "daily", priority: "0.8" },
  { path: "/mosques", changefreq: "weekly", priority: "0.8" },
  { path: "/qiblat", changefreq: "monthly", priority: "0.6" },
];

const SITEMAP_CACHE_MS = 6 * 60 * 60 * 1000;
// Sitemap protocol cap is 50,000 URLs per file.
const SITEMAP_MOSQUE_LIMIT = 49000;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// SITE_URL should be set in production. Falling back to the request's own host
// keeps things working out of the box (trust proxy makes req.protocol honour
// X-Forwarded-Proto from Coolify's proxy).
function siteUrl(req) {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  return configured || `${req.protocol}://${req.get("host")}`;
}

export default function serveFrontend(app, distDir) {
  const indexTemplate = fs.readFileSync(path.join(distDir, "index.html"), "utf8");

  function renderIndex(req, res, status = 200) {
    const site = siteUrl(req);
    const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, "") : "/";
    const html = indexTemplate
      .replaceAll("__CANONICAL_URL__", escapeHtml(site + pathname))
      .replaceAll("__SITE_URL__", escapeHtml(site));
    res.status(status).set("Cache-Control", "no-cache").type("html").send(html);
  }

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").set("Cache-Control", "public, max-age=86400").send(
      ["User-agent: *", "Allow: /", "Disallow: /api/", "Disallow: /settings", "", `Sitemap: ${siteUrl(req)}/sitemap.xml`, ""].join("\n")
    );
  });

  let sitemapCache = { xml: null, site: null, expires: 0 };
  app.get("/sitemap.xml", async (req, res) => {
    const site = siteUrl(req);
    if (!sitemapCache.xml || sitemapCache.site !== site || Date.now() > sitemapCache.expires) {
      const urls = STATIC_PAGES.map(
        (p) => `  <url><loc>${site}${p.path}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
      );
      try {
        if (process.env.DATABASE_URL) {
          const { rows } = await pool.query(
            `SELECT id, updated_at FROM mosques WHERE name IS NOT NULL ORDER BY id LIMIT ${SITEMAP_MOSQUE_LIMIT}`
          );
          for (const row of rows) {
            const lastmod = new Date(row.updated_at).toISOString().slice(0, 10);
            urls.push(`  <url><loc>${site}/mosques/${row.id}</loc><lastmod>${lastmod}</lastmod><priority>0.5</priority></url>`);
          }
        }
      } catch (error) {
        // Still serve the static pages if Postgres is unreachable.
        console.error(`[sitemap] couldn't list mosques: ${error.message}`);
      }
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.join("\n") +
        "\n</urlset>\n";
      sitemapCache = { xml, site, expires: Date.now() + SITEMAP_CACHE_MS };
    }
    res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(sitemapCache.xml);
  });

  // The raw template still has placeholders in it — never serve it directly.
  app.get("/index.html", (req, res) => res.redirect(301, "/"));

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        // Vite fingerprints everything under /assets, so it can be cached forever.
        const isHashedAsset = filePath.startsWith(path.join(distDir, "assets") + path.sep);
        res.set("Cache-Control", isHashedAsset ? "public, max-age=31536000, immutable" : "public, max-age=3600");
      },
    })
  );

  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    renderIndex(req, res, SPA_ROUTE.test(req.path) ? 200 : 404);
  });
}
