// Tournament dates are stored as plain "YYYY-MM-DD" (no time component,
// no timezone) — parsing with the Date constructor directly would treat
// that as midnight UTC and can roll back a day in negative-UTC-offset
// timezones, so this builds the Date from the parts instead.
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (startDate === endDate) {
    return start.toLocaleDateString('en-US', DATE_FORMAT);
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString('en-US', sameYear ? { month: 'short', day: 'numeric' } : DATE_FORMAT);
  const endLabel = end.toLocaleDateString('en-US', DATE_FORMAT);
  return `${startLabel} – ${endLabel}`;
}
