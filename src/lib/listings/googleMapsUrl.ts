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

// The `/maps/place/{text}/` segment is sometimes a real address (when
// the submitter pasted/searched a bare address into Maps) and sometimes
// just a venue name (e.g. "Drucker Center") — Google Maps URLs don't
// reliably embed a place's actual mailing address as text; getting that
// for a named POI would require the Google Places API (a paid service,
// not something this project uses). Only treated as a usable address
// when it starts with a number, the one reliable signal that
// distinguishes "123 Main St" from a venue name — venue names
// essentially never start with a digit.
export function extractAddressFromMapsUrl(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/]+)\//);
  if (!match) return null;

  const decoded = decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
  return /^\d/.test(decoded) ? decoded : null;
}

export interface DecodedMapsUrl {
  lat: number;
  lng: number;
  // null when the link's place segment isn't recognizable as a street
  // address (see extractAddressFromMapsUrl) — callers should fall back
  // to their own geocoding/submitted text in that case, not treat this
  // as a failure.
  address: string | null;
}

// Combines extraction + short-link resolution into one pass so callers
// needing both lat/lng and address don't trigger two redirect-following
// network requests for the same link. Returns null only when no
// coordinates can be found at all — a missing address is represented
// as `address: null` within a successful result, not a null return.
export async function decodeGoogleMapsUrl(url: string): Promise<DecodedMapsUrl | null> {
  let resolved = url;
  if (!extractLatLngFromMapsUrl(url)) {
    try {
      const hostname = new URL(url).hostname;
      if (SHORT_LINK_HOSTNAMES.has(hostname)) {
        resolved = await resolveMapsUrl(url);
      }
    } catch {
      return null;
    }
  }

  const latLng = extractLatLngFromMapsUrl(resolved);
  if (!latLng) return null;

  return { ...latLng, address: extractAddressFromMapsUrl(resolved) };
}
