import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/auth/requireUser';
import { supabaseAdmin } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { isValidGoogleMapsUrl, decodeLatLngFromGoogleMapsUrl } from '../../../lib/listings/googleMapsUrl';
import { sendAdminNotification } from '../../../lib/email';
import type { DayTime } from '../../../types/listing';

export const prerender = false;

const LISTING_TYPES = new Set(['indoor', 'grass', 'beach']);
const COST_TYPES = new Set(['free', 'paid']);
const VISIBILITIES = new Set(['public', 'private']);
const SKILL_LEVELS = new Set(['C', 'B', 'BB', 'A', 'AA']);
const DAYS = new Set(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);

function isValidDaysTimes(value: unknown): value is DayTime[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      DAYS.has((entry as DayTime).day) &&
      ((entry as DayTime).start_time === null || typeof (entry as DayTime).start_time === 'string') &&
      ((entry as DayTime).end_time === null || typeof (entry as DayTime).end_time === 'string'),
  );
}

function nullableString(value: unknown, maxLength: number): string | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > maxLength) return undefined;
  return value;
}

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  // Honeypot — see votes.ts. A real submission still looks accepted.
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  if (typeof body.type !== 'string' || !LISTING_TYPES.has(body.type)) {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }
  if (body.cost !== null && (typeof body.cost !== 'string' || !COST_TYPES.has(body.cost))) {
    return new Response(JSON.stringify({ error: 'Invalid cost' }), { status: 400 });
  }
  if (!isValidDaysTimes(body.days_times)) {
    return new Response(JSON.stringify({ error: 'Invalid days_times' }), { status: 400 });
  }
  if (body.signup_required !== null && typeof body.signup_required !== 'boolean') {
    return new Response(JSON.stringify({ error: 'Invalid signup_required' }), { status: 400 });
  }
  if (body.equipment_supplied !== null && typeof body.equipment_supplied !== 'boolean') {
    return new Response(JSON.stringify({ error: 'Invalid equipment_supplied' }), { status: 400 });
  }
  if (body.team_required !== null && typeof body.team_required !== 'boolean') {
    return new Response(JSON.stringify({ error: 'Invalid team_required' }), { status: 400 });
  }
  if (body.min_skill_level !== null && (typeof body.min_skill_level !== 'string' || !SKILL_LEVELS.has(body.min_skill_level))) {
    return new Response(JSON.stringify({ error: 'Invalid min_skill_level' }), { status: 400 });
  }
  const visibility = body.visibility === 'private' ? 'private' : 'public';
  if (body.visibility !== undefined && !VISIBILITIES.has(visibility)) {
    return new Response(JSON.stringify({ error: 'Invalid visibility' }), { status: 400 });
  }
  if (body.google_maps_url && (typeof body.google_maps_url !== 'string' || !isValidGoogleMapsUrl(body.google_maps_url))) {
    return new Response(JSON.stringify({ error: 'That doesn’t look like a Google Maps link' }), { status: 400 });
  }

  // (0,0) means the address picker never actually set a location — the
  // hidden lat/lng inputs default to empty strings, and Number('') is
  // 0, not NaN, so this previously slipped past validation and created
  // listings admin couldn't approve (geocoding (0,0) finds no city).
  // Falls back to decoding a provided Google Maps link before failing,
  // since that's a real, common path a submitter takes instead of the
  // address picker.
  let lat = typeof body.lat === 'number' && !Number.isNaN(body.lat) ? body.lat : null;
  let lng = typeof body.lng === 'number' && !Number.isNaN(body.lng) ? body.lng : null;
  if ((lat === null || lng === null || (lat === 0 && lng === 0)) && typeof body.google_maps_url === 'string') {
    const decoded = await decodeLatLngFromGoogleMapsUrl(body.google_maps_url);
    if (decoded) {
      lat = decoded.lat;
      lng = decoded.lng;
    }
  }
  if (lat === null || lng === null || (lat === 0 && lng === 0)) {
    return new Response(
      JSON.stringify({
        error:
          'Location is missing — pick an address from the suggestions, drop a pin on the map, or paste a Google Maps link we can read coordinates from.',
      }),
      { status: 400 },
    );
  }

  const name = nullableString(body.name, 200);
  const externalLink = nullableString(body.external_link, 500);
  const notes = nullableString(body.notes, 250);
  const paymentTypes = nullableString(body.payment_types, 100);
  const photoUrl = nullableString(body.photo_url, 500);
  const submittedAddress = nullableString(body.submitted_address, 300);

  if (
    name === undefined ||
    externalLink === undefined ||
    notes === undefined ||
    paymentTypes === undefined ||
    photoUrl === undefined ||
    submittedAddress === undefined
  ) {
    return new Response(JSON.stringify({ error: 'A text field is too long' }), { status: 400 });
  }

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(supabaseAdmin, `submit:${ip}`, { windowMs: 60 * 60 * 1000, max: 5 });
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many submissions — please try again later.' }), { status: 429 });
  }

  // status and submitted_by are always set here, never trusted from the
  // client — this is exactly what the old RLS insert policy enforced
  // before it was dropped in favor of this endpoint.
  const { error } = await supabaseAdmin.from('listings').insert({
    type: body.type,
    cost: body.cost ?? null,
    lat,
    lng,
    days_times: body.days_times,
    signup_required: body.signup_required ?? null,
    name,
    external_link: externalLink,
    min_skill_level: body.min_skill_level ?? null,
    equipment_supplied: body.equipment_supplied ?? null,
    payment_types: paymentTypes,
    team_required: body.team_required ?? null,
    notes,
    submitted_address: submittedAddress,
    google_maps_url: body.google_maps_url || null,
    visibility,
    photo_url: photoUrl,
    submitted_by: auth.userId,
    status: 'pending',
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Awaited rather than fire-and-forget (ROB-102) — Vercel serverless
  // functions can stop executing once the response is sent, so an
  // un-awaited call here isn't reliably guaranteed to actually complete.
  // sendAdminNotification already swallows its own errors, so this
  // can't fail the submission response either way.
  await sendAdminNotification(
    'New listing submitted on FindVolleyball',
    `${name ?? 'An unnamed listing'} (${body.type}) was just submitted.\n\nAddress as entered: ${submittedAddress ?? 'not provided'}\n\nReview it: https://findvolleyball.app/admin`,
  );

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
