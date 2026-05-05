'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestCategory, createTestEntry, cleanDatabase } = require('../helpers/testHelpers');
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

describe('User data isolation', () => {
  describe('User B cannot access User A\'s entries', () => {
    let userA, userB, categoryA, entryA;

    beforeEach(async () => {
      userA = await createTestUser('usera@example.com', 'password123');
      userB = await createTestUser('userb@example.com', 'password123');
      categoryA = await createTestCategory(userA.user.id, 'UserA Category');
      entryA = await createTestEntry(userA.user.id, categoryA.id, {
        amount: 50.00,
        type: 'expense',
        entry_date: '2024-01-15',
        description: 'User A entry',
      });
    });

    it('User B GET entries should return empty array (only their own)', async () => {
      const res = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ entries: [] }));
    });

    it('User B PUT on User A\'s entry should return 403', async () => {
      const res = await request(app)
        .put(`/api/entries/${entryA.id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ amount: 999.99 });

      expect(res.status).toBe(403);
    });

    it('User B DELETE on User A\'s entry should return 403', async () => {
      const res = await request(app)
        .delete(`/api/entries/${entryA.id}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('User B cannot access User A\'s categories', () => {
    let userA, userB, categoryA;

    beforeEach(async () => {
      userA = await createTestUser('usera@example.com', 'password123');
      userB = await createTestUser('userb@example.com', 'password123');
      categoryA = await createTestCategory(userA.user.id, 'UserA Custom Category');
    });

    it('User B DELETE on User A\'s category should return 403', async () => {
      const res = await request(app)
        .delete(`/api/categories/${categoryA.id}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(403);
    });
  });
});
