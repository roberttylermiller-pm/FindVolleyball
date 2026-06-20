import type { DayOfWeek, DayTime } from '../../types/listing';

// Reads DayTimePicker's output from a submitted form. Field naming
// convention: checkbox name="days" value="{day}", paired with
// name="start_{day}"/"end_{day}" time inputs.
export function readDaysTimes(formData: FormData): DayTime[] {
  const days = formData.getAll('days') as string[];

  return days.map((day) => ({
    day: day as DayOfWeek,
    start_time: (formData.get(`start_${day}`) as string) || null,
    end_time: (formData.get(`end_${day}`) as string) || null,
  }));
}
