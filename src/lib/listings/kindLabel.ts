import type { ListingKind } from '../../types/listing';

// "Recurring" reads as a technical/internal term — "Meetup" is what the
// existing UI copy already calls this kind elsewhere (the /submit tab
// is literally "Recurring Meetups").
const KIND_LABELS: Record<ListingKind, string> = {
  recurring: 'Meetup',
  tournament: 'Tournament',
  league: 'League',
};

export function formatListingKindLabel(kind: ListingKind): string {
  return KIND_LABELS[kind];
}
