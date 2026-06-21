// San Fernando Valley — the MVP seed region (see PRD). Shared so other
// map controls (e.g. a future "reset view" button, location search
// fallback) center on the same default rather than redefining it.
export const DEFAULT_MAP_CENTER: [number, number] = [34.1808, -118.4517];
export const DEFAULT_MAP_ZOOM = 11;

// CARTO Positron — a minimal light basemap (no topo contour lines, no
// highway shield numbers) chosen over the default OSM "Carto" style for
// a cleaner, less cluttered look. Free, no API key/account needed,
// unlike Mapbox/Stadia/MapTiler alternatives.
export const TILE_LAYER_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
