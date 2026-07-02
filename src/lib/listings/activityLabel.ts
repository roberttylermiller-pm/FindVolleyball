const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

// created_at and updated_at are set to the same value at insert time (both
// default to now() within the same statement), so a strict inequality is
// enough to tell whether a listing has actually been edited since it was
// added, without needing a tolerance window.
export function formatListingActivityLabel(createdAt: string, updatedAt: string): string {
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  const wasUpdated = updated.getTime() > created.getTime();
  const date = wasUpdated ? updated : created;
  return `${wasUpdated ? 'Updated' : 'Added'} ${date.toLocaleDateString('en-US', DATE_FORMAT)}`;
}
