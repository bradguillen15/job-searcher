import { ScraperError } from "./types";

const TRACKING_PARAMS = new Set([
  "ref",
  "source",
  "fbclid",
  "gclid",
]);

export function sanitizeJobUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ScraperError(`Invalid job URL: ${rawUrl}`);
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  const params = new URLSearchParams(parsed.search);
  for (const key of [...params.keys()]) {
    if (key.startsWith("utm_") || TRACKING_PARAMS.has(key)) {
      params.delete(key);
    }
  }
  parsed.search = params.toString() ? `?${params.toString()}` : "";

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}
