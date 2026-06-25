// Allowlist of real Google Maps hostnames — without this, the address
// link on a listing page would happily render as a hyperlink to
// whatever URL a submitter pasted in, including a phishing link
// disguised as "tap to view on Maps."
const ALLOWED_HOSTNAMES = new Set(['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl']);

export function isValidGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && ALLOWED_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}
