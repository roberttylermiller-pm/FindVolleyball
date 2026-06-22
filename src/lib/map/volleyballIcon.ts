import L from 'leaflet';
import type { ListingType } from '../../types/listing';

// Small emoji badge per surface (ROB-67) — distinguishes Indoor/Grass/
// Beach markers at a glance without needing separate icon image assets.
const TYPE_BADGES: Record<ListingType, string> = {
  indoor: '🏠',
  grass: '🌱',
  beach: '🌊',
};

// A CSS-only divIcon (emoji + styled circle) instead of an image asset —
// avoids the broken-icon problem entirely (no file path to get wrong
// under a bundler) and matches the dark/high-tech direction better than
// Leaflet's default teardrop pin anyway.
export function createVolleyballIcon(type: ListingType): L.DivIcon {
  return L.divIcon({
    className: 'volleyball-marker',
    html: `<div class="volleyball-marker-badge">🏐<span class="volleyball-marker-type">${TYPE_BADGES[type]}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}
