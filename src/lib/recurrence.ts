import type { Frequency, RegularSpending } from '../types';

type RecurringSchedule = Pick<RegularSpending, 'startDate' | 'endDate' | 'frequency'>;

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addMonthsClamped(d: Date, months: number, anchorDay: number): Date {
  const next = new Date(d);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(anchorDay, lastDay));
  return next;
}

function advanceOccurrence(d: Date, frequency: Frequency, anchorDay: number): Date {
  const next = new Date(d);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      return addMonthsClamped(next, 1, anchorDay);
    case 'quarterly':
      return addMonthsClamped(next, 3, anchorDay);
    case 'yearly':
      return addMonthsClamped(next, 12, anchorDay);
  }
  return next;
}

export function getOccurrences(
  frequency: Frequency,
  from: Date,
  to: Date,
  anchorDay: number,
  maxOccurrences = 100
): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (current <= end && dates.length < maxOccurrences) {
    dates.push(new Date(current));
    const next = advanceOccurrence(current, frequency, anchorDay);
    current.setTime(next.getTime());
  }
  return dates;
}

export function countOccurrencesInRange(
  item: RecurringSchedule,
  start: Date,
  end: Date,
  maxOccurrences = 240
): number {
  const itemStart = parseLocalDate(item.startDate);
  if (!itemStart) return 0;

  const itemEnd = parseLocalDate(item.endDate);
  if (itemEnd && itemEnd < start) return 0;
  if (itemStart > end) return 0;

  const anchorDay = itemStart.getDate();
  let current = new Date(itemStart);
  const msDay = 86_400_000;

  if (current < start) {
    if (item.frequency === 'daily' || item.frequency === 'weekly' || item.frequency === 'biweekly') {
      const stepDays = item.frequency === 'daily' ? 1 : item.frequency === 'weekly' ? 7 : 14;
      const diffDays = Math.floor((start.getTime() - current.getTime()) / msDay);
      const jumps = Math.floor(diffDays / stepDays);
      current.setDate(current.getDate() + jumps * stepDays);
      while (current < start) current.setDate(current.getDate() + stepDays);
    } else {
      let guard = 0;
      while (current < start && guard < maxOccurrences) {
        current = advanceOccurrence(current, item.frequency, anchorDay);
        guard += 1;
      }
    }
  }

  const effectiveEnd = itemEnd && itemEnd < end ? itemEnd : end;
  if (current > effectiveEnd) return 0;

  let count = 0;
  let guard = 0;
  while (current <= effectiveEnd && guard < maxOccurrences) {
    count += 1;
    current = advanceOccurrence(current, item.frequency, anchorDay);
    guard += 1;
  }
  return count;
}
