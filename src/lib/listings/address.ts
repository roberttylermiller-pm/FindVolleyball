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

// `address` is usually our own reverse-geocoded guess from the pin's
// coordinates, which can snap to the wrong nearby building even with a
// precise pin (ROB-109) — confirmed in practice (ROB-114): a submitter
// who pastes a Google Maps link has effectively already looked up the
// real address, so when both a Maps link and their typed address exist,
// that typed text outranks our own geocoding. Without a Maps link,
// `address` stays first — there's no stronger signal to prefer over it
// in that case. Falls back to the vaguer neighborhood/city only when
// neither real address source exists at all.
//
// This is read-time logic, not a stored value — shipping this change
// alone retroactively changes what every existing listing displays, no
// backfill needed.
export function formatAddressDisplay(listing: Listing): string | null {
  if (listing.google_maps_url && listing.submitted_address) return listing.submitted_address;
  if (listing.address) return listing.address;
  if (listing.submitted_address) return listing.submitted_address;
  if (listing.neighborhood || listing.city) {
    return [listing.neighborhood ?? listing.city].filter(Boolean).join(', ');
  }
  return null;
}
