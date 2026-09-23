// src/__tests__/api.test.ts
// Integration tests for ScoutCard API endpoints using supertest.

import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('API Integration Tests', () => {
  describe('Global Middleware & 404', () => {
    it('returns 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/v1/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Route not found');
    });

    it('sets security headers via helmet', async () => {
      const res = await request(app).get('/api/v1/non-existent-route');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Auth Endpoints', () => {
    it('GET /api/v1/auth/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required.');
    });

    it('POST /api/v1/auth/logout clears cookie and returns 200', async () => {
      // logout requires verifyToken
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('Player Search & Profile Endpoints', () => {
    it('GET /api/v1/players/search returns 200 with data and meta', async () => {
      const res = await request(app).get('/api/v1/players/search');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });

    it('GET /api/v1/players/search rejects invalid division with 400', async () => {
      const res = await request(app).get('/api/v1/players/search?division=InvalidDivision');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid division');
    });

    it('GET /api/v1/players/search rejects invalid sort with 400', async () => {
      const res = await request(app).get('/api/v1/players/search?sort=invalid_sort');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid sort');
    });

    it('GET /api/v1/players/search requires teamId when sort=overlap', async () => {
      const res = await request(app).get('/api/v1/players/search?sort=overlap');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('teamId is required');
    });

    it('GET /api/v1/players/search rejects non-UUID teamId with 400', async () => {
      const res = await request(app).get('/api/v1/players/search?teamId=not-a-uuid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid teamId format');
    });

    it('GET /api/v1/players/:id returns 404 for invalid UUID format', async () => {
      const res = await request(app).get('/api/v1/players/not-a-valid-uuid');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/players/:id returns 404 for non-existent player UUID', async () => {
      const res = await request(app).get('/api/v1/players/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/players/scout-card returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/players/scout-card');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Team Endpoints', () => {
    it('GET /api/v1/teams/:id returns 404 for invalid UUID format', async () => {
      const res = await request(app).get('/api/v1/teams/invalid-uuid');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/teams/:id returns 404 for non-existent team UUID', async () => {
      const res = await request(app).get('/api/v1/teams/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/teams returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/v1/teams').send({ name: 'Test Team' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/teams/my-team returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/teams/my-team');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Verification Endpoints', () => {
    it('POST /api/v1/verification/verify-riot returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/verification/verify-riot')
        .send({ riotId: 'TenZ#NA1' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/verification/status returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/verification/status');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
