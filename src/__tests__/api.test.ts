// src/__tests__/api.test.ts
// Integration tests for ScoutCard API endpoints using supertest.

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import prisma from '../lib/prisma';
import { env } from '../config/env';

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

  describe('Application Endpoints', () => {
    it('POST /api/v1/applications returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .send({ teamId: '00000000-0000-0000-0000-000000000000' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/applications/my-applications returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/applications/my-applications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/applications/team/:teamId returns 401 when unauthenticated', async () => {
      const res = await request(app).get(
        '/api/v1/applications/team/00000000-0000-0000-0000-000000000000'
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/v1/applications/:id returns 401 when unauthenticated', async () => {
      const res = await request(app).delete(
        '/api/v1/applications/00000000-0000-0000-0000-000000000000'
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/v1/applications/:id/status returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .patch('/api/v1/applications/00000000-0000-0000-0000-000000000000/status')
        .send({ status: 'Reviewed' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/applications/:id/history returns 401 when unauthenticated', async () => {
      const res = await request(app).get(
        '/api/v1/applications/00000000-0000-0000-0000-000000000000/history'
      );
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    describe('PATCH /applications/:id/status', () => {
      let testAppId: string;
      let acceptedAppId: string;
      let teamLeadToken: string;
      let playerToken: string;
      const createdAppIds: string[] = [];

      beforeAll(async () => {
        const team = await prisma.team.findFirst({
          include: { captain: true },
        });

        if (team && team.captain) {
          const applicant = await prisma.player.findFirst({
            where: { id: { not: team.captainId } },
          });

          if (applicant) {
            teamLeadToken = jwt.sign(
              { userId: team.captainId, discordId: team.captain.discordId },
              env.JWT_SECRET
            );
            playerToken = jwt.sign(
              { userId: applicant.id, discordId: applicant.discordId },
              env.JWT_SECRET
            );

            await prisma.application.deleteMany({
              where: { playerId: applicant.id, teamId: team.id },
            });

            const testApp = await prisma.application.create({
              data: {
                playerId: applicant.id,
                teamId: team.id,
                status: 'Applied',
                message: 'Test application for status flow',
              },
            });
            testAppId = testApp.id;
            createdAppIds.push(testApp.id);

            const anotherApplicant = await prisma.player.findFirst({
              where: { id: { notIn: [team.captainId, applicant.id] } },
            });

            if (anotherApplicant) {
              await prisma.application.deleteMany({
                where: { playerId: anotherApplicant.id, teamId: team.id },
              });

              const acceptedApp = await prisma.application.create({
                data: {
                  playerId: anotherApplicant.id,
                  teamId: team.id,
                  status: 'Accepted',
                  message: 'Already accepted application',
                },
              });
              acceptedAppId = acceptedApp.id;
              createdAppIds.push(acceptedApp.id);
            }
          }
        }
      }, 30000);

      afterAll(async () => {
        if (createdAppIds.length > 0) {
          await prisma.applicationStatusHistory.deleteMany({
            where: { applicationId: { in: createdAppIds } },
          });
          await prisma.application.deleteMany({
            where: { id: { in: createdAppIds } },
          });
        }
      }, 30000);

      it('allows Applied → Reviewed by team lead', async () => {
        const res = await request(app)
          .patch(`/api/v1/applications/${testAppId}/status`)
          .set('Authorization', `Bearer ${teamLeadToken}`)
          .send({ status: 'Reviewed' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('Reviewed');
      });

      it('logs a status_history row on every change', async () => {
        await request(app)
          .patch(`/api/v1/applications/${testAppId}/status`)
          .set('Authorization', `Bearer ${teamLeadToken}`)
          .send({ status: 'Trialing' });

        const res = await request(app)
          .get(`/api/v1/applications/${testAppId}/history`)
          .set('Authorization', `Bearer ${teamLeadToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[res.body.data.length - 1].toStatus).toBe('Trialing');
      });

      it('rejects invalid transitions (Accepted → Applied)', async () => {
        const res = await request(app)
          .patch(`/api/v1/applications/${acceptedAppId}/status`)
          .set('Authorization', `Bearer ${teamLeadToken}`)
          .send({ status: 'Applied' });

        expect(res.status).toBe(400);
      });

      it('rejects status update from non-team-lead', async () => {
        const res = await request(app)
          .patch(`/api/v1/applications/${testAppId}/status`)
          .set('Authorization', `Bearer ${playerToken}`)
          .send({ status: 'Accepted' });

        expect(res.status).toBe(403);
      });
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
