// src/__tests__/availability.test.ts
// Unit tests for the 168-hour weekly availability system.

import {
  getHourIndex,
  getDayHours,
  summariseAvailability,
  isScheduleCompatible,
  scheduleOverlapCount,
  calculateOverlapWithSet,
  validateAvailabilityHours,
} from '../utils/availability';

describe('Availability Utils', () => {
  describe('getHourIndex', () => {
    it('calculates correct hour index', () => {
      expect(getHourIndex(0, 0)).toBe(0);     // Monday 00:00
      expect(getHourIndex(0, 23)).toBe(23);   // Monday 23:00
      expect(getHourIndex(1, 0)).toBe(24);    // Tuesday 00:00
      expect(getHourIndex(6, 23)).toBe(167);  // Sunday 23:00
    });
  });

  describe('getDayHours', () => {
    it('returns all 24 hours for a day', () => {
      const mondayHours = getDayHours(0);
      expect(mondayHours).toHaveLength(24);
      expect(mondayHours[0]).toBe(0);
      expect(mondayHours[23]).toBe(23);

      const tuesdayHours = getDayHours(1);
      expect(tuesdayHours).toHaveLength(24);
      expect(tuesdayHours[0]).toBe(24);
      expect(tuesdayHours[23]).toBe(47);
    });
  });

  describe('summariseAvailability', () => {
    it('formats singular and plural hours', () => {
      expect(summariseAvailability([1])).toBe('Available 1 hour/week');
      expect(summariseAvailability([1, 2, 3])).toBe('Available 3 hours/week');
      expect(summariseAvailability([])).toBe('Available 0 hours/week');
    });
  });

  describe('isScheduleCompatible', () => {
    it('returns true if player hours contain all required hours', () => {
      const playerHours = [10, 11, 12, 13, 14];
      const requiredHours = [11, 12];
      expect(isScheduleCompatible(playerHours, requiredHours)).toBe(true);
    });

    it('returns false if player is missing any required hour', () => {
      const playerHours = [10, 11, 12];
      const requiredHours = [11, 12, 13];
      expect(isScheduleCompatible(playerHours, requiredHours)).toBe(false);
    });

    it('returns true if no required hours', () => {
      expect(isScheduleCompatible([1, 2], [])).toBe(true);
    });
  });

  describe('scheduleOverlapCount & calculateOverlapWithSet', () => {
    it('calculates number of overlapping hours', () => {
      const playerHours = [1, 5, 10, 15, 20];
      const requiredHours = [5, 10, 25, 30];

      expect(scheduleOverlapCount(playerHours, requiredHours)).toBe(2);

      const requiredSet = new Set(requiredHours);
      expect(calculateOverlapWithSet(playerHours, requiredSet)).toBe(2);
    });

    it('returns 0 when there is no overlap', () => {
      const playerHours = [1, 2, 3];
      const requiredHours = [4, 5, 6];

      expect(scheduleOverlapCount(playerHours, requiredHours)).toBe(0);
      expect(calculateOverlapWithSet(playerHours, new Set(requiredHours))).toBe(0);
    });

    it('returns 0 for empty arrays', () => {
      expect(scheduleOverlapCount([], [1, 2])).toBe(0);
      expect(scheduleOverlapCount([1, 2], [])).toBe(0);
      expect(calculateOverlapWithSet([], new Set([1, 2]))).toBe(0);
      expect(calculateOverlapWithSet([1, 2], new Set())).toBe(0);
    });
  });

  describe('validateAvailabilityHours', () => {
    it('validates 0-167 integer indices', () => {
      expect(validateAvailabilityHours([0, 50, 100, 167])).toBe(true);
      expect(validateAvailabilityHours([])).toBe(true);
    });

    it('rejects numbers out of range or non-integers', () => {
      expect(validateAvailabilityHours([-1])).toBe(false);
      expect(validateAvailabilityHours([168])).toBe(false);
      expect(validateAvailabilityHours([2.5])).toBe(false);
    });
  });
});
