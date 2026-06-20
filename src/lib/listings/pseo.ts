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
  slug: string;
  last_verified_date: string;
}

// Candidate slug only — does not check for collisions against existing
// rows, since that requires a DB round trip. Callers (seed script,
// backfill script) are responsible for uniqueness via uniqueSlug().
export async function assignPseoFields(listing: PseoAssignmentInput): Promise<PseoAssignment> {
  const { city, neighborhood } = await reverseGeocode(listing.lat, listing.lng);
  const slug = buildListingSlug({
    city,
    neighborhood,
    type: listing.type,
    name: listing.name,
    id: listing.id,
  });
  return { city, neighborhood, slug, last_verified_date: new Date().toISOString() };
}

// Appends a numeric suffix until the candidate doesn't collide with an
// existing row. Shared by the seed/backfill scripts and the admin
// approve endpoint, which all need this check against the live table.
export async function findUniqueSlug(client: SupabaseClient, candidate: string): Promise<string> {
  let slug = candidate;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await client.from('listings').select('id').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;

    slug = `${candidate}-${suffix}`;
    suffix += 1;
  }
}
