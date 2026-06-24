import type { ListingType } from '../../types/listing';

// Display label only — the stored value stays 'beach' (slugs, filters,
// the DB column) to avoid breaking existing /courts/[slug] URLs already
// submitted to Google Search Console. "Sand" is more accurate than
// "Beach" since plenty of sand courts aren't actually at a beach (park
// courts, rec center sand pits).
const TYPE_LABELS: Record<ListingType, string> = {
  indoor: 'Indoor',
  grass: 'Grass',
  beach: 'Sand',
};

export function formatListingTypeLabel(type: ListingType): string {
  return TYPE_LABELS[type];
}
