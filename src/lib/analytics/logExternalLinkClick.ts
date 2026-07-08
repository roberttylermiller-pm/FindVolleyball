// Fire-and-forget — an external link always opens in its own tab/window
// (or is a mailto:, which the browser handles independently), so nothing
// on the current page depends on this call finishing or succeeding.
export function logExternalLinkClick(listingId: string): void {
  fetch('/api/analytics/external-link-click', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId }),
  }).catch(() => {});
}
