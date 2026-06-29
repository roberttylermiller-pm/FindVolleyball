export interface ReverseGeocodeResult {
  city: string;
  // Null when the location has no neighbourhood-level subdivision in OSM
  // data (common for small standalone cities, e.g. West Hollywood — it
  // IS the city, with nothing finer-grained to report).
  neighborhood: string | null;
  // Full mailing address ("5015 Tujunga Ave, North Hollywood, CA 91601")
  // — null only when Nominatim has no road name for the point at all
  // (e.g. a pin dropped in open parkland). House number, state, and zip
  // are each individually optional since Nominatim doesn't always have
  // them, but city is required (see below) so the address always has
  // somewhere to anchor to.
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
  county?: string;
  state?: string;
  postcode?: string;
}

// Nominatim returns full state names ("California"), not USPS
// abbreviations — needed for a mailing-address-shaped display string.
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH',
  Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  'District of Columbia': 'DC',
};

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
  // zoom=18 (rooftop-level) is what gets Nominatim to actually include a
  // house_number — zoom=16 (street-level) only returns the road name.
  url.searchParams.set('zoom', '18');
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
  // Falls back to the county when Nominatim has no city/town/village at
  // all — common for unincorporated areas (e.g. a CDP like "Columbine,
  // CO" has only a suburb + county tag, no city), which previously
  // failed reverse geocoding entirely (ROB-127). Stripped of the
  // trailing " County" since that reads oddly as a city name on its
  // own ("Jefferson", not "Jefferson County").
  const county = address.county?.replace(/\s*County$/i, '').trim() || null;
  const city = address.city ?? address.town ?? address.village ?? county;

  if (!city) {
    throw new Error(`Reverse geocode returned no usable city for ${lat},${lng}`);
  }

  const street = [address.house_number, address.road].filter(Boolean).join(' ');
  const stateAbbreviation = address.state ? US_STATE_ABBREVIATIONS[address.state] ?? address.state : null;
  const stateZip = [stateAbbreviation, address.postcode].filter(Boolean).join(' ');
  const fullAddress = [street, city, stateZip].filter(Boolean).join(', ') || null;

  return { city, neighborhood, address: fullAddress };
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

export interface AddressSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

interface PhotonProperties {
  housenumber?: string;
  street?: string;
  district?: string;
  city?: string;
  locality?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countrycode?: string;
  name?: string;
}

const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';

// Backs the live as-you-type autocomplete on /submit (ROB-103, replacing
// the Nominatim-based version from ROB-97). Nominatim's /search is a
// general-purpose geocoder doing fuzzy full-text matching across all OSM
// data (street names, business names, POIs) — fine for "look up this one
// place" but bad for predictive partial-address typing (e.g. "4524 N
// Clyb" matched a yacht club in Newfoundland). Photon is purpose-built
// for autocomplete and supports a lat/lon proximity bias, which Nominatim
// doesn't. Reverse geocoding above stays on Nominatim — that part works
// fine and isn't the as-you-type use case.
//
// biasLat/biasLng should be the current map view center (or another
// reasonable "most likely area" guess) — Photon uses it to rank nearby
// results higher without restricting to that area, so addresses outside
// it (a different city, a different country) still surface, just lower.
export async function geocodeSuggestions(
  query: string,
  biasLat: number,
  biasLng: number,
): Promise<AddressSuggestion[]> {
  const url = new URL(PHOTON_SEARCH_URL);
  url.searchParams.set('q', query);
  // Requests more than the 5 we show — OSM often splits one street into
  // several way segments that share the same display address, so a few
  // get collapsed by the de-dupe below before slicing to the final 5.
  url.searchParams.set('limit', '8');
  url.searchParams.set('lat', String(biasLat));
  url.searchParams.set('lon', String(biasLng));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Address suggestions failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    features: Array<{ properties: PhotonProperties; geometry: { coordinates: [number, number] } }>;
  };

  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];

  for (const { properties, geometry } of data.features) {
    const displayName = formatSuggestionAddress(properties);
    if (seen.has(displayName)) continue;
    seen.add(displayName);
    suggestions.push({ displayName, lat: geometry.coordinates[1], lng: geometry.coordinates[0] });
    if (suggestions.length === 5) break;
  }

  return suggestions;
}

function formatSuggestionAddress(properties: PhotonProperties): string {
  // Same "Neighborhood Council District" cleanup as reverseGeocode above
  // — LA-area OSM data tags districts with their formal governance name,
  // which reads as noise in a suggestion list.
  const rawDistrict = properties.district ?? properties.locality ?? null;
  const district = rawDistrict ? rawDistrict.replace(/\s*Neighborhood Council District$/i, '').trim() || null : null;
  const city = properties.city ?? district;

  const street = [properties.housenumber, properties.street].filter(Boolean).join(' ');
  const stateAbbreviation = properties.state ? US_STATE_ABBREVIATIONS[properties.state] ?? properties.state : null;
  const stateZip = [stateAbbreviation, properties.postcode].filter(Boolean).join(' ');
  // Country only shown outside the US — redundant noise for the common
  // case, but needed since submissions now come from other countries too.
  const country = properties.countrycode && properties.countrycode !== 'US' ? properties.country : null;

  return (
    [properties.name, street, city, stateZip, country].filter(Boolean).join(', ') || properties.name || 'Unknown location'
  );
}
