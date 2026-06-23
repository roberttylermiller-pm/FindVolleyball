import type { CostType, DayOfWeek, DayTime, ListingType } from '../../types/listing';

export interface ListingFilters {
  types: Set<ListingType>;
  costs: Set<CostType>;
  days: Set<DayOfWeek>;
}

export const LISTING_FILTERS_EVENT = 'listing-filters-change';

export function defaultListingFilters(): ListingFilters {
  return {
    types: new Set(['indoor', 'grass', 'beach']),
    costs: new Set(['free', 'paid']),
    days: new Set(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
  };
}

export function listingMatchesFilters(
  listing: { type: ListingType; cost: CostType | null; days_times: DayTime[] },
  filters: ListingFilters,
): boolean {
  // A listing with unknown cost shouldn't be hidden just because neither
  // Free nor Paid is what it is — it's neither, so the filter shouldn't
  // gate it at all.
  const costMatches = listing.cost === null || filters.costs.has(listing.cost);
  // Same idea for days: a listing with no schedule entered at all isn't
  // "wrong" for any day filter — only hide it if it HAS days and none of
  // them are selected.
  const daysMatches =
    listing.days_times.length === 0 || listing.days_times.some((dayTime) => filters.days.has(dayTime.day));
  return filters.types.has(listing.type) && costMatches && daysMatches;
}
