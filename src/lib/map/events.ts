export const MAP_PAN_TO_EVENT = 'map-pan-to';

export interface MapPanToDetail {
  lat: number;
  lng: number;
  boundingBox: [south: number, north: number, west: number, east: number];
}

// Fired by Map.astro whenever the list pane's relevant result set
// changes — a filters change, or the map panning/zooming enough to
// move the (padded) viewport bounds — so ListView.astro can render
// without a second, independently-timed fetch of the same data. Unlike
// the markers themselves, this is scoped to roughly the visible map
// area (ROB-131 follow-up) rather than every filter-matched listing
// everywhere, since a list of mostly-elsewhere results next to a map
// someone's actually looking at one city on isn't useful.
export const LISTING_RESULTS_EVENT = 'listing-results-change';

// Fired by ListView.astro when a list row is clicked — Map.astro
// listens and zooms/spiderfies to reveal that marker (delegating to
// markercluster's own zoomToShowLayer rather than reimplementing that
// logic) and opens its popup.
export const LISTING_SELECT_EVENT = 'listing-select';

export interface ListingSelectDetail {
  listingId: string;
}
