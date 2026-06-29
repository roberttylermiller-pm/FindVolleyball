import type { CostType, DayOfWeek, DayTime, ListingKind, ListingType } from '../../types/listing';

export interface ListingFilters {
  types: Set<ListingType>;
  costs: Set<CostType>;
  days: Set<DayOfWeek>;
  kinds: Set<ListingKind>;
}

export const LISTING_FILTERS_EVENT = 'listing-filters-change';

export function defaultListingFilters(): ListingFilters {
  return {
    types: new Set(['indoor', 'grass', 'beach']),
    costs: new Set(['free', 'paid']),
    days: new Set(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
    kinds: new Set(['recurring', 'tournament', 'league']),
  };
}

export function listingMatchesFilters(
  listing: { type: ListingType; cost: CostType | null; days_times: DayTime[]; listing_kind: ListingKind },
  filters: ListingFilters,
): boolean {
  // Unknown cost is treated as Free for filtering purposes (ROB-87) —
  // most "cost unknown" listings turn out to be free community/rec
  // center sessions, so this errs toward showing them rather than
  // hiding them when someone's specifically looking for free play.
  const costMatches = filters.costs.has(listing.cost ?? 'free');
  // Same idea for days: a listing with no schedule entered at all isn't
  // "wrong" for any day filter — only hide it if it HAS days and none of
  // them are selected.
  const daysMatches =
    listing.days_times.length === 0 || listing.days_times.some((dayTime) => filters.days.has(dayTime.day));
  return filters.types.has(listing.type) && costMatches && daysMatches && filters.kinds.has(listing.listing_kind);
}
