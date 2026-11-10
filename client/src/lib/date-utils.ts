/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export function getTodayString(): string {
  const now: Date = new Date();
  const year: number = now.getFullYear();
  const month: string = String(now.getMonth() + 1).padStart(2, '0');
  const day: string = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates adjacent date by offsetting days from a base YYYY-MM-DD.
 */
export function getAdjacentDate(baseDate: string, offsetDays: number): string {
  const parts: string[] = baseDate.split('-');
  const year: number = Number(parts[0]);
  const month: number = Number(parts[1]) - 1;
  const day: number = Number(parts[2]);

  const target: Date = new Date(year, month, day);
  target.setDate(target.getDate() + offsetDays);

  const resYear: number = target.getFullYear();
  const resMonth: string = String(target.getMonth() + 1).padStart(2, '0');
  const resDay: string = String(target.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Checks whether a given date string is today.
 */
export function isTodayDate(dateString: string): boolean {
  return dateString === getTodayString();
}

/**
 * Formats YYYY-MM-DD string to a readable Korean date format.
 */
export function formatDateDisplay(dateString: string): string {
  const parts: string[] = dateString.split('-');
  if (parts.length !== 3) {
    return dateString;
  }
  return `${parts[0]}년 ${Number(parts[1])}월 ${Number(parts[2])}일`;
}

/**
 * Validates whether the string matches YYYY-MM-DD format.
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const regex: RegExp = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  const timestamp: number = Date.parse(dateString);
  return !Number.isNaN(timestamp);
}
