// src/__tests__/validation.test.ts
// Unit tests for validation helpers and scout card rules.

import { isValidUuid } from '../utils/validation';
import {
  isValidVodUrl,
  validateScoutCard,
  calculateCompletionScore,
} from '../services/player.service';

describe('Validation Helpers', () => {
  describe('isValidUuid', () => {
    it('accepts valid UUID strings', () => {
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUuid('c7f9b455-9268-47a0-944f-6dc4653767c3')).toBe(true);
    });

    it('rejects invalid strings, malformed UUIDs, and non-strings', () => {
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // too short
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000z')).toBe(false); // non-hex
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
      expect(isValidUuid(12345)).toBe(false);
    });
  });

  describe('isValidVodUrl', () => {
    it('accepts valid YouTube links', () => {
      expect(isValidVodUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidVodUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isValidVodUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
    });

    it('accepts valid Medal.tv clip links', () => {
      expect(isValidVodUrl('https://medal.tv/games/valorant/clips/sampleClip123/xyz')).toBe(true);
      expect(isValidVodUrl('https://medal.tv/clips/sampleClip123')).toBe(true);
    });

    it('rejects invalid or unsupported video links', () => {
      expect(isValidVodUrl('https://twitch.tv/videos/123456')).toBe(false);
      expect(isValidVodUrl('https://vimeo.com/123456')).toBe(false);
      expect(isValidVodUrl('not-a-url')).toBe(false);
    });
  });

  describe('validateScoutCard', () => {
    it('enforces all required fields in publish mode', () => {
      const errors = validateScoutCard({}, 'publish');
      const fields = errors.map((e) => e.field);

      expect(fields).toContain('division');
      expect(fields).toContain('mainAgents');
      expect(fields).toContain('flexAgent');
      expect(fields).toContain('playstyleTags');
      expect(fields).toContain('vodUrl');
      expect(fields).toContain('availableHours');
    });

    it('allows partial fields in draft mode', () => {
      const errors = validateScoutCard({ division: 'Elite' }, 'draft');
      expect(errors).toHaveLength(0);
    });

    it('validates agent names against VALORANT_AGENTS', () => {
      const errors = validateScoutCard(
        { mainAgents: ['InvalidAgent1', 'InvalidAgent2'] },
        'draft'
      );
      expect(errors.some((e) => e.field === 'mainAgents')).toBe(true);
    });

    it('rejects flexAgent duplicating mainAgent', () => {
      const errors = validateScoutCard(
        { mainAgents: ['Jett', 'Omen'], flexAgent: 'Jett' },
        'draft'
      );
      expect(errors.some((e) => e.field === 'flexAgent')).toBe(true);
    });
  });

  describe('calculateCompletionScore', () => {
    it('returns 100 for a fully populated scout card', () => {
      const score = calculateCompletionScore({
        riotId: 'Player#TAG',
        isVerified: true,
        division: 'Elite',
        mainAgents: ['Jett', 'Omen'],
        flexAgent: 'Raze',
        playstyleTags: ['Entry'],
        vodUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        availableHours: [10, 11, 12],
      });
      expect(score).toBe(100);
    });

    it('returns 0 for an empty scout card', () => {
      const score = calculateCompletionScore({
        riotId: null,
        isVerified: false,
        division: null,
        mainAgents: [],
        flexAgent: null,
        playstyleTags: [],
        vodUrl: null,
        availableHours: [],
      });
      expect(score).toBe(0);
    });
  });
});
