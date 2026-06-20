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
  neighborhood: string;
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
