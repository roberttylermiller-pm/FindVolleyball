export const MAP_PAN_TO_EVENT = 'map-pan-to';

export interface MapPanToDetail {
  lat: number;
  lng: number;
  boundingBox: [south: number, north: number, west: number, east: number];
}

// Fired by Map.astro every time the marker set it actually rendered
// changes (initial load or a filters change) — ListView.astro listens
// so the list pane always shows exactly what's on the map, without a
// second, independently-timed fetch of the same data.
export const LISTING_RESULTS_EVENT = 'listing-results-change';

// Fired by ListView.astro when a list row is clicked — Map.astro
// listens and zooms/spiderfies to reveal that marker (delegating to
// markercluster's own zoomToShowLayer rather than reimplementing that
// logic) and opens its popup.
export const LISTING_SELECT_EVENT = 'listing-select';

export interface ListingSelectDetail {
  listingId: string;
}
