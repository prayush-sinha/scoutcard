// src/utils/availability.ts
// Helpers for the 168-hour weekly availability system.
// Hour indices: 0 = Monday 00:00, 23 = Monday 23:00, 24 = Tuesday 00:00 ...
// 167 = Sunday 23:00

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const TOTAL_HOURS = 168;

/**
 * Returns the hour index for a given day (0-6) and hour (0-23).
 */
export function getHourIndex(day: number, hour: number): number {
  return day * 24 + hour;
}

/**
 * Returns all hour indices for a given day (0-6).
 */
export function getDayHours(day: number): number[] {
  return Array.from({ length: 24 }, (_, h) => getHourIndex(day, h));
}

/**
 * Returns a human-readable summary: "Available 15 hours/week".
 */
export function summariseAvailability(hours: number[]): string {
  return `Available ${hours.length} hour${hours.length === 1 ? '' : 's'}/week`;
}

/**
 * Checks if a player's available hours fully contain a team's required hours.
 * i.e., the player is free during ALL of the team's practice hours.
 */
export function isScheduleCompatible(
  playerHours: number[],
  requiredHours: number[]
): boolean {
  const playerSet = new Set(playerHours);
  return requiredHours.every((h) => playerSet.has(h));
}

/**
 * Returns the number of overlapping hours between player and team schedules.
 */
export function scheduleOverlapCount(
  playerHours: number[],
  requiredHours: number[]
): number {
  const playerSet = new Set(playerHours);
  return requiredHours.filter((h) => playerSet.has(h)).length;
}

/**
 * Validates that all indices are in range 0-167.
 */
export function validateAvailabilityHours(hours: number[]): boolean {
  return hours.every((h) => Number.isInteger(h) && h >= 0 && h < TOTAL_HOURS);
}
