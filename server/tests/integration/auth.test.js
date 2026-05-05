'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { createTestUser, cleanDatabase } = require('../helpers/testHelpers');
const { sequelize } = require('../../src/models/index');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Protected endpoints reject unauthenticated requests', () => {
  const protectedEndpoints = [
    { method: 'get', path: '/api/categories' },
    { method: 'post', path: '/api/categories' },
    { method: 'delete', path: '/api/categories/1' },
    { method: 'get', path: '/api/entries' },
    { method: 'post', path: '/api/entries' },
    { method: 'put', path: '/api/entries/1' },
    { method: 'delete', path: '/api/entries/1' },
    { method: 'get', path: '/api/dashboard/summary' },
    { method: 'get', path: '/api/dashboard/charts/pie' },
    { method: 'get', path: '/api/dashboard/charts/bar' },
    { method: 'get', path: '/api/dashboard/charts/line' },
  ];

  describe.each(protectedEndpoints)('$method $path', ({ method, path }) => {
    it('should return 401 without Authorization header', async () => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        [method](path)
        .set('Authorization', 'Bearer invalid-token-string');
      expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );
      // Small delay to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 10));

      const res = await request(app)
        [method](path)
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });
  });
});
