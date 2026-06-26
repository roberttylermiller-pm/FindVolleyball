import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../../../lib/auth/requireAdmin';
import { supabaseAdmin } from '../../../../../lib/supabase/server';
import { isValidGoogleMapsUrl } from '../../../../../lib/listings/googleMapsUrl';
import type { DayTime, Listing } from '../../../../../types/listing';

export const prerender = false;

const LISTING_TYPES = new Set(['indoor', 'grass', 'beach']);
const COST_TYPES = new Set(['free', 'paid']);
const VISIBILITIES = new Set(['public', 'private']);
const SKILL_LEVELS = new Set(['C', 'B', 'BB', 'A', 'AA']);
const DAYS = new Set(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
const LISTING_KINDS = new Set(['recurring', 'tournament', 'league']);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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

// Full editable surface for the admin "edit details" UI (ROB-65) — wider
// than override.ts's narrow decayed/status toggles. Editing lat/lng here
// does NOT re-run reverse geocoding (city/neighborhood/address/slug stay
// as-is); fix those fields directly if the pin moves somewhere new.
type EditableField = keyof Listing;
const EDITABLE_FIELDS: EditableField[] = [
  'name',
  'listing_kind',
  'start_date',
  'end_date',
  'type',
  'cost',
  'lat',
  'lng',
  'days_times',
  'signup_required',
  'external_link',
  'min_skill_level',
  'equipment_supplied',
  'notes',
  'visibility',
  'payment_types',
  'team_required',
  'photo_url',
  'address',
  'city',
  'neighborhood',
  'submitted_address',
  'google_maps_url',
];

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing listing id' }), { status: 400 });
  }

  const body = (await request.json()) as Partial<Record<EditableField, unknown>>;
  const update: Record<string, unknown> = {};

  for (const field of EDITABLE_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];

    switch (field) {
      case 'type':
        if (typeof value !== 'string' || !LISTING_TYPES.has(value)) {
          return new Response(JSON.stringify({ error: `Invalid type: ${value}` }), { status: 400 });
        }
        break;
      case 'cost':
        if (value !== null && (typeof value !== 'string' || !COST_TYPES.has(value))) {
          return new Response(JSON.stringify({ error: `Invalid cost: ${value}` }), { status: 400 });
        }
        break;
      case 'visibility':
        if (typeof value !== 'string' || !VISIBILITIES.has(value)) {
          return new Response(JSON.stringify({ error: `Invalid visibility: ${value}` }), { status: 400 });
        }
        break;
      case 'min_skill_level':
        if (value !== null && (typeof value !== 'string' || !SKILL_LEVELS.has(value))) {
          return new Response(JSON.stringify({ error: `Invalid min_skill_level: ${value}` }), { status: 400 });
        }
        break;
      case 'lat':
      case 'lng':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return new Response(JSON.stringify({ error: `Invalid ${field}: ${value}` }), { status: 400 });
        }
        break;
      case 'days_times':
        if (!isValidDaysTimes(value)) {
          return new Response(JSON.stringify({ error: 'Invalid days_times' }), { status: 400 });
        }
        break;
      case 'signup_required':
        if (value !== null && typeof value !== 'boolean') {
          return new Response(JSON.stringify({ error: 'Invalid signup_required' }), { status: 400 });
        }
        break;
      case 'equipment_supplied':
      case 'team_required':
        if (value !== null && typeof value !== 'boolean') {
          return new Response(JSON.stringify({ error: `Invalid ${field}` }), { status: 400 });
        }
        break;
      case 'google_maps_url':
        if (value !== null && (typeof value !== 'string' || !isValidGoogleMapsUrl(value))) {
          return new Response(JSON.stringify({ error: 'Invalid google_maps_url' }), { status: 400 });
        }
        break;
      case 'listing_kind':
        if (typeof value !== 'string' || !LISTING_KINDS.has(value)) {
          return new Response(JSON.stringify({ error: `Invalid listing_kind: ${value}` }), { status: 400 });
        }
        break;
      case 'start_date':
      case 'end_date':
        if (value !== null && (typeof value !== 'string' || !DATE_ONLY.test(value))) {
          return new Response(JSON.stringify({ error: `Invalid ${field}` }), { status: 400 });
        }
        break;
      default:
        // name, external_link, notes, payment_types, photo_url, address,
        // city, neighborhood, submitted_address — free-form nullable
        // text, no enum to check.
        if (value !== null && typeof value !== 'string') {
          return new Response(JSON.stringify({ error: `Invalid ${field}` }), { status: 400 });
        }
    }

    update[field] = value;
  }

  if (Object.keys(update).length === 0) {
    return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });
  }

  const { error } = await supabaseAdmin.from('listings').update(update).eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
