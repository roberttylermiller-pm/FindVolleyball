import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../../lib/supabase/server';
import { assignPseoFields, findUniqueSlug } from '../../../../../lib/listings/pseo';

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
    .select('id, lat, lng, type, name, slug')
    .eq('id', id)
    .single();

  if (fetchError || !listing) {
    return new Response(JSON.stringify({ error: 'Listing not found' }), { status: 404 });
  }

  const update: Record<string, unknown> = { status: 'approved' };

  if (!listing.slug) {
    try {
      const { city, neighborhood, slug: candidateSlug, last_verified_date } = await assignPseoFields(listing);
      update.city = city;
      update.neighborhood = neighborhood;
      update.slug = await findUniqueSlug(supabaseAdmin, candidateSlug);
      update.last_verified_date = last_verified_date;
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Geocoding failed: ${err instanceof Error ? err.message : err}` }),
        { status: 502 },
      );
    }
  }

  const { error: updateError } = await supabaseAdmin.from('listings').update(update).eq('id', id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
