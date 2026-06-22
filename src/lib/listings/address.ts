import type { Listing } from '../../types/listing';

// Prefer the actual address text — Maps shows a recognizable place
// (with the venue's name search-matched where possible) instead of a
// bare coordinate pin. Falls back to lat/lng only when there's no
// address text to use (e.g. Nominatim had no road name for the point).
export function buildMapsHref(listing: Listing): string {
  const query = formatAddressDisplay(listing) ?? `${listing.lat},${listing.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// `address` is the full formatted mailing address when present (street,
// city, state, zip — see reverseGeocode). Older listings backfilled
// before that existed may only have neighborhood/city.
export function formatAddressDisplay(listing: Listing): string | null {
  if (listing.address) return listing.address;
  if (listing.neighborhood || listing.city) {
    return [listing.neighborhood ?? listing.city].filter(Boolean).join(', ');
  }
  return null;
}
