export interface ReverseGeocodeResult {
  city: string;
  // Null when the location has no neighbourhood-level subdivision in OSM
  // data (common for small standalone cities, e.g. West Hollywood — it
  // IS the city, with nothing finer-grained to report).
  neighborhood: string | null;
  // Street-level address (e.g. "17361 Victory Blvd") — null when Nominatim
  // has no road name for the point (e.g. a pin dropped in open parkland).
  address: string | null;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
}

// Nominatim (OpenStreetMap) — free, no API key, consistent with the
// earlier decision to avoid Google Maps costs. Usage policy caps this at
// ~1 request/second and requires a descriptive User-Agent; both are fine
// at MVP submission volume. See decisions log for the full tradeoff.
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('zoom', '16');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url, {
    headers: { 'User-Agent': 'play-volleyball-app (contact: robert.tyler.miller@gmail.com)' },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocode failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { address?: NominatimAddress };
  const address = data.address ?? {};

  // LA-area OSM data tags many areas with their formal governance name
  // (e.g. "North Hollywood Neighborhood Council District") rather than
  // the casual neighborhood name — fine for a map tooltip, bad for an
  // SEO title. Stripped here since it's specifically a display concern.
  const rawNeighborhood = address.neighbourhood ?? address.suburb ?? address.quarter ?? null;
  const neighborhood = rawNeighborhood
    ? rawNeighborhood.replace(/\s*Neighborhood Council District$/i, '').trim() || null
    : null;
  const city = address.city ?? address.town ?? address.village;

  if (!city) {
    throw new Error(`Reverse geocode returned no usable city for ${lat},${lng}`);
  }

  const streetAddress = [address.house_number, address.road].filter(Boolean).join(' ') || null;

  return { city, neighborhood, address: streetAddress };
}

export interface GeocodeLocationResult {
  lat: number;
  lng: number;
  // [south, north, west, east] — used to fit the map view to the result's
  // actual extent (a zip code and a city shouldn't get the same zoom).
  boundingBox: [number, number, number, number];
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

// Runs client-side (location search box), unlike reverseGeocode above —
// browsers silently strip a custom User-Agent header on fetch, so this
// relies on the Referer header the browser sends automatically, which
// Nominatim's usage policy also accepts for attribution.
export async function geocodeLocation(query: string): Promise<GeocodeLocationResult | null> {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Location search failed: ${response.status} ${response.statusText}`);
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
  }>;

  const [result] = results;
  if (!result) return null;

  const [south, north, west, east] = result.boundingbox.map(Number) as [number, number, number, number];

  return { lat: Number(result.lat), lng: Number(result.lon), boundingBox: [south, north, west, east] };
}
