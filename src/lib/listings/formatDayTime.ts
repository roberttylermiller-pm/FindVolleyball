import type { DayOfWeek, DayTime } from '../../types/listing';

const DAY_LABELS: Record<DayOfWeek, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

// Times are stored as 24-hour "HH:MM" (native <input type="time"> format)
// but displayed 12-hour with AM/PM per Robert's request — "Wed 07:00 PM",
// not "Wed 19:00".
function formatTime12h(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minute} ${period}`;
}

export function formatDayTime(dt: DayTime): string {
  const dayLabel = DAY_LABELS[dt.day];
  if (!dt.start_time && !dt.end_time) return dayLabel;
  if (dt.start_time && dt.end_time) {
    return `${dayLabel} ${formatTime12h(dt.start_time)}–${formatTime12h(dt.end_time)}`;
  }
  return `${dayLabel} ${formatTime12h((dt.start_time ?? dt.end_time) as string)}`;
}
