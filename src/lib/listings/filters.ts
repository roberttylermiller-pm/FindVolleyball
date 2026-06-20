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
  listing: { type: ListingType; cost: CostType },
  filters: ListingFilters,
): boolean {
  return filters.types.has(listing.type) && filters.costs.has(listing.cost);
}
