import { format, parseISO } from 'date-fns';

export function getLocalDateString(date: Date | string, timeZone: string = 'UTC'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch (err) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  }
}

export function isTaskCompletedToday(
  lastCompletedAtUtc: string | Date | null | undefined,
  userTimezone: string = 'UTC'
): boolean {
  if (!lastCompletedAtUtc) return false;

  const todayLocal = getLocalDateString(new Date(), userTimezone);
  const lastCompletedLocal = getLocalDateString(lastCompletedAtUtc, userTimezone);

  return todayLocal === lastCompletedLocal;
}
