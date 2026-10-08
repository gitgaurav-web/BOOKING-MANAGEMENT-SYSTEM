/**
 * Strict calendar date validation.
 * Rejects rollover impossible dates such as 2026-02-31, 2026-04-31, non-leap year 2026-02-29, etc.
 */
export function isValidStrictIsoDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Strict 24-hour time validation (HH:mm).
 * Enforces hours 00-23 and minutes 00-59. Rejects invalid times like 29:90 or 12:65.
 */
export function isValidStrictTime(timeStr: string): boolean {
  if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) {
    return false;
  }
  const [hStr, mStr] = timeStr.split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Returns the current calendar date in YYYY-MM-DD according to a specified timezone (default: Asia/Kolkata).
 */
export function getLocalIsoDate(timeZone: string = 'Asia/Kolkata'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}
