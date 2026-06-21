import type { SupabaseClient } from '@supabase/supabase-js';
import { reverseGeocode } from '../geocode';
import { buildListingSlug } from '../slug';

export interface PseoAssignmentInput {
  id: string;
  lat: number;
  lng: number;
  type: string;
  name: string | null;
}

export interface PseoAssignment {
  city: string;
  neighborhood: string | null;
  address: string | null;
  slug: string;
  last_verified_date: string;
}

// Candidate slug only — does not check for collisions against existing
// rows, since that requires a DB round trip. Callers (seed script,
// backfill script) are responsible for uniqueness via uniqueSlug().
export async function assignPseoFields(listing: PseoAssignmentInput): Promise<PseoAssignment> {
  const { city, neighborhood, address } = await reverseGeocode(listing.lat, listing.lng);
  const slug = buildListingSlug({
    city,
    neighborhood,
    type: listing.type,
    name: listing.name,
    id: listing.id,
  });
  return { city, neighborhood, address, slug, last_verified_date: new Date().toISOString() };
}

// Appends a numeric suffix until the candidate doesn't collide with an
// existing row. Shared by the seed/backfill scripts and the admin
// approve endpoint, which all need this check against the live table.
// excludeId matters for re-running backfill on a row that already has a
// slug (e.g. one missing only `address`) — without it, the row would see
// its own existing slug as a "collision" and needlessly renumber itself.
export async function findUniqueSlug(
  client: SupabaseClient,
  candidate: string,
  excludeId?: string,
): Promise<string> {
  let slug = candidate;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = client.from('listings').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return slug;

    slug = `${candidate}-${suffix}`;
    suffix += 1;
  }
}
