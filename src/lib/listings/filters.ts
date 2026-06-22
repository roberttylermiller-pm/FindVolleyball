import type { CostType, ListingType } from '../../types/listing';

export interface ListingFilters {
  types: Set<ListingType>;
  costs: Set<CostType>;
}

export const LISTING_FILTERS_EVENT = 'listing-filters-change';

export function defaultListingFilters(): ListingFilters {
  return {
    types: new Set(['indoor', 'grass', 'beach']),
    costs: new Set(['free', 'paid']),
  };
}

export function listingMatchesFilters(
  listing: { type: ListingType; cost: CostType | null },
  filters: ListingFilters,
): boolean {
  // A listing with unknown cost shouldn't be hidden just because neither
  // Free nor Paid is what it is — it's neither, so the filter shouldn't
  // gate it at all.
  const costMatches = listing.cost === null || filters.costs.has(listing.cost);
  return filters.types.has(listing.type) && costMatches;
}
