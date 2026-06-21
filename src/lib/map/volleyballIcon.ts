import L from 'leaflet';

// A CSS-only divIcon (emoji + styled circle) instead of an image asset —
// avoids the broken-icon problem entirely (no file path to get wrong
// under a bundler) and matches the dark/high-tech direction better than
// Leaflet's default teardrop pin anyway.
export function createVolleyballIcon(): L.DivIcon {
  return L.divIcon({
    className: 'volleyball-marker',
    html: '<div class="volleyball-marker-badge">🏐</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}
