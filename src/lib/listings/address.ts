import type { Listing } from '../../types/listing';

// Coordinates rather than the address text — guarantees an accurate pin
// even when Nominatim's address breakdown is partial (missing house
// number, etc.), and works as a deep link into whichever map app the
// user's device defaults to (Google Maps, Apple Maps, etc.).
export function buildMapsHref(listing: Listing): string {
  return `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`;
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
