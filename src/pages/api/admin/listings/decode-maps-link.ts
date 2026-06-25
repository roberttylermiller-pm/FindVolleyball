import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { isValidGoogleMapsUrl, decodeGoogleMapsUrl } from '../../../../lib/listings/googleMapsUrl';
import { reverseGeocode } from '../../../../lib/geocode';

export const prerender = false;

// Backs the "Decode from Maps link" button in the admin edit dialog
// (ROB-108/ROB-109) — replaces manually opening the link and copying
// lat/lng out of the address bar by hand. When the link doesn't embed a
// real address (a named venue like "Drucker Center" rather than a bare
// address search), re-runs reverse geocoding using the link's precise
// place coordinates instead of leaving address/city/neighborhood
// unset — this is also what fixes a previously-wrong geocoded address
// that came from a less precise pin.
export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  if (!body?.url || typeof body.url !== 'string' || !isValidGoogleMapsUrl(body.url)) {
    return new Response(JSON.stringify({ error: 'Not a valid Google Maps link' }), { status: 400 });
  }

  const decoded = await decodeGoogleMapsUrl(body.url);
  if (!decoded) {
    return new Response(
      JSON.stringify({ error: "Couldn't find coordinates in that link — it may not be a place pin." }),
      { status: 422 },
    );
  }

  if (decoded.address) {
    return new Response(JSON.stringify(decoded), { headers: { 'content-type': 'application/json' } });
  }

  try {
    const geocoded = await reverseGeocode(decoded.lat, decoded.lng);
    return new Response(
      JSON.stringify({ ...decoded, address: geocoded.address, city: geocoded.city, neighborhood: geocoded.neighborhood }),
      { headers: { 'content-type': 'application/json' } },
    );
  } catch {
    // Geocoding failure isn't fatal here — lat/lng are still useful on
    // their own, address/city/neighborhood just stay whatever they were.
    return new Response(JSON.stringify(decoded), { headers: { 'content-type': 'application/json' } });
  }
};
