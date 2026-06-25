// Allowlist of real Google Maps hostnames — without this, the address
// link on a listing page would happily render as a hyperlink to
// whatever URL a submitter pasted in, including a phishing link
// disguised as "tap to view on Maps."
const ALLOWED_HOSTNAMES = new Set(['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl']);

export function isValidGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && ALLOWED_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}

const SHORT_LINK_HOSTNAMES = new Set(['maps.app.goo.gl', 'goo.gl']);

export interface LatLng {
  lat: number;
  lng: number;
}

// Google Maps URLs encode coordinates a couple of different ways. A
// place pin's actual coordinates show up as `!3d{lat}!4d{lng}` (used
// when present, since it's the specific point of interest); the `@lat,
// lng,zoom` segment is just the map viewport center, which can be
// offset from the pin — only used as a fallback when no `!3d!4d` pair
// exists. Short links (maps.app.goo.gl, goo.gl) don't expose either in
// the URL itself; resolveMapsUrl() must run first to get a long URL.
export function extractLatLngFromMapsUrl(url: string): LatLng | null {
  const placeMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (placeMatch) {
    return { lat: Number(placeMatch[1]), lng: Number(placeMatch[2]) };
  }

  const viewportMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (viewportMatch) {
    return { lat: Number(viewportMatch[1]), lng: Number(viewportMatch[2]) };
  }

  return null;
}

// Server-side only (relies on a redirect chain visible to fetch — not
// reliably readable cross-origin from a browser). Short links resolve
// to a long URL containing the coordinate patterns above.
async function resolveMapsUrl(url: string): Promise<string> {
  const response = await fetch(url, { redirect: 'follow' });
  return response.url || url;
}

// Combines the two: tries direct extraction first (no network call
// needed for an already-long URL), and only resolves a short link if
// that fails. Returns null if neither the URL nor its resolved form
// contains a usable coordinate pair.
export async function decodeLatLngFromGoogleMapsUrl(url: string): Promise<LatLng | null> {
  const direct = extractLatLngFromMapsUrl(url);
  if (direct) return direct;

  try {
    const hostname = new URL(url).hostname;
    if (!SHORT_LINK_HOSTNAMES.has(hostname)) return null;
    const resolved = await resolveMapsUrl(url);
    return extractLatLngFromMapsUrl(resolved);
  } catch {
    return null;
  }
}
