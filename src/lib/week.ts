import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  addDays,
  addWeeks,
  setDay,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

export const TIMEZONE = 'Europe/Paris';

export interface WeekInfo {
  year: number;
  isoWeek: number;
  votingOpensAt: Date;
  votingClosesAt: Date;
}

/** Returns Paris "now". */
export function nowParis(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/** Given a UTC Date, returns its ISO week number in Paris timezone. */
export function getParisISOWeek(date: Date): number {
  const paris = toZonedTime(date, TIMEZONE);
  return getISOWeek(paris);
}

export function getParisISOWeekYear(date: Date): number {
  const paris = toZonedTime(date, TIMEZONE);
  return getISOWeekYear(paris);
}

/**
 * Returns the voting window for an ISO week (year + weekNumber).
 * Opens:  Monday 07:00 Paris
 * Closes: Friday 20:00 Paris
 */
export function getVotingWindow(year: number, isoWeek: number): WeekInfo {
  // Find the Monday of this ISO week in Paris
  const jan4 = new Date(year, 0, 4); // Jan 4 is always in week 1
  const jan4Paris = toZonedTime(jan4, TIMEZONE);
  const weekStart = startOfISOWeek(jan4Paris);
  const targetMonday = addWeeks(weekStart, isoWeek - getISOWeek(jan4Paris));

  // Monday 07:00 Paris
  const mondayOpens = new Date(
    targetMonday.getFullYear(),
    targetMonday.getMonth(),
    targetMonday.getDate(),
    7,
    0,
    0,
    0
  );

  // Friday = Monday + 4, at 20:00 Paris
  const fridayParis = addDays(targetMonday, 4);
  const fridayCloses = new Date(
    fridayParis.getFullYear(),
    fridayParis.getMonth(),
    fridayParis.getDate(),
    20,
    0,
    0,
    0
  );

  const votingOpensAt = fromZonedTime(mondayOpens, TIMEZONE);
  const votingClosesAt = fromZonedTime(fridayCloses, TIMEZONE);

  return { year, isoWeek, votingOpensAt, votingClosesAt };
}

/** Returns WeekInfo for the current ISO week (based on Paris time). */
export function getCurrentWeekInfo(): WeekInfo {
  const now = new Date();
  const year = getParisISOWeekYear(now);
  const isoWeek = getParisISOWeek(now);
  return getVotingWindow(year, isoWeek);
}

/** Returns WeekInfo for the next ISO week. */
export function getNextWeekInfo(): WeekInfo {
  const now = new Date();
  const nextWeek = addWeeks(now, 1);
  const year = getParisISOWeekYear(nextWeek);
  const isoWeek = getParisISOWeek(nextWeek);
  return getVotingWindow(year, isoWeek);
}

/** Format a UTC date as ISO string (stored in SQLite). */
export function toIsoString(date: Date): string {
  return date.toISOString();
}

/** Parse ISO string from SQLite back to Date. */
export function fromIsoString(s: string): Date {
  return new Date(s);
}

/** Human-readable label for a week: "Sem. 18 · 2026". */
export function weekLabel(year: number, isoWeek: number): string {
  return `Sem. ${isoWeek} · ${year}`;
}

/** Returns month label: "Mai 2026". */
export function monthLabel(year: number, month: number): string {
  const months = [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai',
    'Juin',
    'Juill.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ];
  return `${months[month - 1]} ${year}`;
}

/** Returns the weeks that overlap with a given month (Paris time). */
export function getWeeksForMonth(year: number, month: number): Array<{ year: number; isoWeek: number }> {
  const result: Array<{ year: number; isoWeek: number }> = [];
  const seen = new Set<string>();

  // Iterate every day of the month
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day, 12, 0, 0);
    const w = getISOWeek(d);
    const y = getISOWeekYear(d);
    const key = `${y}-${w}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ year: y, isoWeek: w });
    }
  }
  return result;
}
