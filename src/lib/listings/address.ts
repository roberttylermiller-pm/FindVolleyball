import type { Listing } from '../../types/listing';
import { isValidGoogleMapsUrl } from './googleMapsUrl';

// Prefers a submitter-supplied Google Maps link (ROB-99) when present —
// useful for venues a plain address search doesn't represent well (an
// unnamed park court, a specific entrance). Re-validated here rather
// than trusted blindly, since this value round-trips through the admin
// edit form too. Otherwise falls back to the actual address text (Maps
// shows a recognizable place instead of a bare coordinate pin), and
// finally to lat/lng if there's no address text either.
export function buildMapsHref(listing: Listing): string {
  if (listing.google_maps_url && isValidGoogleMapsUrl(listing.google_maps_url)) {
    return listing.google_maps_url;
  }
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
