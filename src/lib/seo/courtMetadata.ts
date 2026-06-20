import type { ListingType } from '../../types/listing';

export interface CourtMetadataInput {
  type: ListingType;
  city: string;
  neighborhood: string;
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
export function buildCourtMetadata({ type, city, neighborhood }: CourtMetadataInput): CourtMetadata {
  const title = `Where to Play ${capitalize(type)} Volleyball in ${neighborhood}, ${city} | FindVolleyball`;
  const description = `Find free or paid ${type} volleyball meetups, pickup games, and open gyms in ${neighborhood}, ${city}. View map location, game times, and joining links.`;

  return { title, description };
}
