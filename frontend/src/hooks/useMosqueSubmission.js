import { useState } from "react";

// Unset in a production build means the API is served from the same origin.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

/** Backs the "contribute a mosque/surau" form: resolving a pasted Google
 * Maps link to coordinates, and submitting the finished form. Both hit
 * POST endpoints under /api/mosques that land in the `mosque_submissions`
 * moderation queue — nothing here writes to the live map directly. */
export default function useMosqueSubmission() {
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  async function resolveLocation(url) {
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch(`${API_URL}/api/mosques/resolve-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(json.message || "Couldn't resolve that link.");
        err.code = json.error;
        throw err;
      }
      return json;
    } catch (err) {
      setResolveError(err);
      return null;
    } finally {
      setResolving(false);
    }
  }

  async function submit(payload) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_URL}/api/mosques/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(json.message || "Couldn't submit — please try again.");
        err.code = json.error;
        throw err;
      }
      return json;
    } catch (err) {
      setSubmitError(err);
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  return { resolveLocation, resolving, resolveError, submit, submitting, submitError };
}
