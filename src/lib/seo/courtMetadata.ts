import type { ListingType } from '../../types/listing';
import { formatListingTypeLabel } from '../listings/typeLabel';

export interface CourtMetadataInput {
  type: ListingType;
  city: string;
  neighborhood: string | null;
}

export interface CourtMetadata {
  title: string;
  description: string;
}

// Formulas agreed for the M2.5 pSEO pivot:
// Title: "Where to Play [Surface] Volleyball in [Neighborhood], [City] | FindVolleyball"
// Description: "Find free or paid [surface] volleyball meetups, pickup games,
//   and open gyms in [Neighborhood], [City]. View map location, game times,
//   and joining links."
// Neighborhood is omitted when null (small standalone cities, e.g. West
// Hollywood, have no neighbourhood-level subdivision to report) — falls
// back to just "[City]" rather than rendering an empty/dangling comma.
export function buildCourtMetadata({ type, city, neighborhood }: CourtMetadataInput): CourtMetadata {
  const place = neighborhood ? `${neighborhood}, ${city}` : city;
  const label = formatListingTypeLabel(type);
  const title = `Where to Play ${label} Volleyball in ${place} | FindVolleyball`;
  const description = `Find free or paid ${label.toLowerCase()} volleyball meetups, pickup games, and open gyms in ${place}. View map location, game times, and joining links.`;

  return { title, description };
}
