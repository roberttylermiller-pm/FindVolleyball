export type UsageEvent = 'list_opened' | 'list_card_clicked';

// Fire-and-forget - nothing on the page depends on this finishing.
export function logUsageEvent(event: UsageEvent): void {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}
