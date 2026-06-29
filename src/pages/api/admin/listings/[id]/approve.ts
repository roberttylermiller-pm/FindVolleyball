import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../../lib/supabase/server';
import { reverseGeocode } from '../../../../../lib/geocode';
import { findUniqueSlug } from '../../../../../lib/listings/pseo';
import { buildListingSlug } from '../../../../../lib/slug';

export const prerender = false;

// Approving is also where pSEO fields (city/neighborhood/slug) get
// assigned — per the M2.5 decision, geocoding happens at submission/
// approval time, not on every listing the moment it's inserted, since a
// pending listing isn't public yet and might still be rejected.
export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing listing id' }), { status: 400 });
  }

  const { data: listing, error: fetchError } = await supabaseAdmin
    .from('listings')
    .select('id, lat, lng, type, name, slug, address, city, neighborhood')
    .eq('id', id)
    .single();

  if (fetchError || !listing) {
    return new Response(JSON.stringify({ error: 'Listing not found' }), { status: 404 });
  }

  const update: Record<string, unknown> = { status: 'approved' };

  if (!listing.slug) {
    // city/neighborhood/address might already be set — an admin can type
    // them in manually via the edit dialog, e.g. after Nominatim fails to
    // find a usable city for a rural/unincorporated pin (ROB-127). Reverse
    // geocoding still runs to fill in whatever's missing (and to pick up
    // neighborhood/address even when city was the only manual fix needed),
    // but a failure there only blocks approval if there's no city at all
    // to fall back on — a manually-entered one is good enough to proceed
    // with, just without the extra enrichment a successful geocode would
    // have added.
    let city = listing.city;
    let neighborhood = listing.neighborhood;
    // Preserves a higher-confidence address already set at submission
    // time (extracted directly from a submitter's Google Maps link)
    // instead of clobbering it with our own reverse-geocoded guess,
    // which can snap to the wrong nearby street (ROB-109).
    let address = listing.address;
    let lastVerifiedDate: string | null = null;

    try {
      const geocoded = await reverseGeocode(listing.lat, listing.lng);
      city = city ?? geocoded.city;
      neighborhood = neighborhood ?? geocoded.neighborhood;
      address = address ?? geocoded.address;
      lastVerifiedDate = new Date().toISOString();
    } catch (err) {
      if (!city) {
        return new Response(
          JSON.stringify({ error: `Geocoding failed: ${err instanceof Error ? err.message : err}` }),
          { status: 502 },
        );
      }
    }

    const candidateSlug = buildListingSlug({ city, neighborhood, type: listing.type, name: listing.name, id: listing.id });
    update.city = city;
    update.neighborhood = neighborhood;
    update.address = address;
    update.slug = await findUniqueSlug(supabaseAdmin, candidateSlug, listing.id);
    // Falls back to "now" even when reverse geocoding failed — the listing
    // is still being verified/approved right now, just with a manually
    // supplied city instead of a geocoded one.
    update.last_verified_date = lastVerifiedDate ?? new Date().toISOString();
  }

  const { error: updateError } = await supabaseAdmin.from('listings').update(update).eq('id', id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
