// San Fernando Valley — the MVP seed region (see PRD). Shared so other
// map controls (e.g. a future "reset view" button, location search
// fallback) center on the same default rather than redefining it.
export const DEFAULT_MAP_CENTER: [number, number] = [34.1808, -118.4517];
export const DEFAULT_MAP_ZOOM = 11;

// Used when centering on the visitor's own location instead of the
// default region. City-level rather than neighborhood-tight —
// listing coverage is still patchy outside the original seed region,
// so a tight zoom risks landing on an empty map with no pins in view
// at all if the visitor isn't near existing listings.
export const USER_LOCATION_ZOOM = 12;

// CARTO Positron tiles (the previous basemap here) started requiring a
// paid API key mid-2026 — anonymous requests now render with an
// "API KEY REQUIRED" watermark instead of map tiles. Switched to Esri's
// World Light Gray Canvas, a visually similar minimal light basemap
// that's genuinely free with no account/key, split into two layers
// (base + reference labels) the way Esri publishes it — both added to
// the map in that order wherever TILE_LAYER_URL is used.
export const TILE_LAYER_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
export const TILE_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
export const TILE_LAYER_ATTRIBUTION = '&copy; <a href="https://www.esri.com">Esri</a>';
// Esri only renders these canvas tiles up to z16 — Leaflet's
// maxNativeZoom upscales that last tile for anything beyond it instead
// of requesting (and 404ing on) tiles that don't exist server-side.
export const TILE_LAYER_MAX_NATIVE_ZOOM = 16;
