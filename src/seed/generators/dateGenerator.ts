const DAYS_PER_MONTH = 30;

export function daysAgo(value: number, referenceDate = new Date()): Date {
  return new Date(referenceDate.getTime() - value * 24 * 60 * 60 * 1000);
}

export function monthsAgo(value: number, referenceDate = new Date()): Date {
  return daysAgo(value * DAYS_PER_MONTH, referenceDate);
}

export function ensureChronologicalOrder(...dates: Date[]): Date[] {
  return dates.sort((left, right) => left.getTime() - right.getTime());
}
