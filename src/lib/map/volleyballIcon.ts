import L from 'leaflet';
import type { ListingKind, ListingType } from '../../types/listing';

// Small emoji badge per surface (ROB-67) — distinguishes Indoor/Grass/
// Sand markers at a glance without needing separate icon image assets.
// "beach" stays the stored value (see typeLabel.ts) but the badge uses a
// beach-umbrella icon rather than waves, since plenty of sand courts
// aren't actually on a beach.
// Exported so other surfaces showing the same surface-type-at-a-glance
// info (e.g. ListView.astro's cards) use the identical emoji instead of
// a second, driftable copy of this map.
export const TYPE_BADGES: Record<ListingType, string> = {
  indoor: '🏠',
  grass: '🌱',
  beach: '🏖️',
};

// A CSS-only divIcon (emoji + styled circle) instead of an image asset —
// avoids the broken-icon problem entirely (no file path to get wrong
// under a bundler) and matches the dark/high-tech direction better than
// Leaflet's default teardrop pin anyway.
//
// Tournaments (ROB-113) and leagues (ROB-116) swap the main emoji so
// they're visually distinct from recurring meetups and each other at a
// glance, but keep the same small surface-type badge in the corner —
// the surface something's played on is still useful at-a-glance info
// regardless of what kind of listing it is.
export const KIND_EMOJI: Record<ListingKind, string> = {
  recurring: '🏐',
  tournament: '🏆',
  league: '🏟️',
};

export function createVolleyballIcon(type: ListingType, kind: ListingKind = 'recurring'): L.DivIcon {
  const mainEmoji = KIND_EMOJI[kind];
  return L.divIcon({
    className: 'volleyball-marker',
    html: `<div class="volleyball-marker-badge">${mainEmoji}<span class="volleyball-marker-type">${TYPE_BADGES[type]}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}
