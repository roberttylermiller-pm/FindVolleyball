import type { ListingType } from '../../types/listing';

export interface CourtMetadataInput {
  type: ListingType;
  city: string;
  neighborhood: string | null;
}

export interface CourtMetadata {
  title: string;
  description: string;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
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
  const title = `Where to Play ${capitalize(type)} Volleyball in ${place} | FindVolleyball`;
  const description = `Find free or paid ${type} volleyball meetups, pickup games, and open gyms in ${place}. View map location, game times, and joining links.`;

  return { title, description };
}
