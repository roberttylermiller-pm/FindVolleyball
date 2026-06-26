import L from 'leaflet';
import type { ListingKind, ListingType } from '../../types/listing';

// Small emoji badge per surface (ROB-67) — distinguishes Indoor/Grass/
// Sand markers at a glance without needing separate icon image assets.
// "beach" stays the stored value (see typeLabel.ts) but the badge uses a
// beach-umbrella icon rather than waves, since plenty of sand courts
// aren't actually on a beach.
const TYPE_BADGES: Record<ListingType, string> = {
  indoor: '🏠',
  grass: '🌱',
  beach: '🏖️',
};

// A CSS-only divIcon (emoji + styled circle) instead of an image asset —
// avoids the broken-icon problem entirely (no file path to get wrong
// under a bundler) and matches the dark/high-tech direction better than
// Leaflet's default teardrop pin anyway.
//
// Tournaments (ROB-113) swap the main emoji for a trophy so they're
// visually distinct from recurring meetups at a glance, but keep the
// same small surface-type badge in the corner — the surface a
// tournament is played on is still useful at-a-glance info.
export function createVolleyballIcon(type: ListingType, kind: ListingKind = 'recurring'): L.DivIcon {
  const mainEmoji = kind === 'tournament' ? '🏆' : '🏐';
  return L.divIcon({
    className: 'volleyball-marker',
    html: `<div class="volleyball-marker-badge">${mainEmoji}<span class="volleyball-marker-type">${TYPE_BADGES[type]}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}
