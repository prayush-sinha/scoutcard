import { DAY_PARTS, DAYS_OF_WEEK } from "./constants";

/** Hour Index = (Day Index * 24) + Hour of Day. Day 0 = Monday, ... Day 6 = Sunday. */
export function hourIndex(dayIndex: number, hourOfDay: number): number {
  return dayIndex * 24 + hourOfDay;
}

export function dayAndHour(index: number): { day: number; hour: number } {
  return { day: Math.floor(index / 24), hour: index % 24 };
}

export function dayLabel(dayIndex: number): string {
  return DAYS_OF_WEEK[dayIndex] ?? "?";
}

/** All 168 hour indices covered by a (day, day-part) cell in the coarse filter grid. */
export function blockIndices(dayIndex: number, partKey: (typeof DAY_PARTS)[number]["key"]): number[] {
  const part = DAY_PARTS.find((p) => p.key === partKey);
  if (!part) return [];
  return part.hours.map((h) => hourIndex(dayIndex, h));
}

/** Whether every hour in a coarse block is present in the availability set. */
export function isBlockActive(available: Set<number>, dayIndex: number, partKey: (typeof DAY_PARTS)[number]["key"]): boolean {
  const indices = blockIndices(dayIndex, partKey);
  return indices.length > 0 && indices.every((i) => available.has(i));
}

/** Count of overlapping hours between a player's availability and a team's practice hours. */
export function overlapCount(a: number[], b: number[]): number {
  const setB = new Set(b);
  return a.reduce((count, h) => (setB.has(h) ? count + 1 : count), 0);
}
