import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import { isValidGoogleMapsUrl, decodeLatLngFromGoogleMapsUrl } from '../../../../lib/listings/googleMapsUrl';

export const prerender = false;

// Backs the "Decode from Maps link" button in the admin edit dialog
// (ROB-108) — replaces manually opening the link and copying lat/lng
// out of the address bar by hand.
export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  if (!body?.url || typeof body.url !== 'string' || !isValidGoogleMapsUrl(body.url)) {
    return new Response(JSON.stringify({ error: 'Not a valid Google Maps link' }), { status: 400 });
  }

  const result = await decodeLatLngFromGoogleMapsUrl(body.url);
  if (!result) {
    return new Response(
      JSON.stringify({ error: "Couldn't find coordinates in that link — it may not be a place pin." }),
      { status: 422 },
    );
  }

  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
};
