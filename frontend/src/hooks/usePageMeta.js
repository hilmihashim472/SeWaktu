import { useEffect } from "react";

const SITE_NAME = "SeWaktu";

function setMeta(selector, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute("content", value);
}

// Keeps the tab title, description, and share/canonical tags in sync with the
// current page as the user navigates client-side. The first load already has
// correct values from index.html (filled in by the backend).
export default function usePageMeta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Waktu Solat Malaysia`;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[name="twitter:title"]', fullTitle);

    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    const url = window.location.origin + window.location.pathname;
    document.head.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
    setMeta('meta[property="og:url"]', url);
  }, [title, description]);
}
