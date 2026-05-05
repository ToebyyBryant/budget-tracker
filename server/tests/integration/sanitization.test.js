'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestCategory, cleanDatabase } = require('../helpers/testHelpers');
const { sequelize, User } = require('../../src/models/index');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Input sanitization', () => {
  let user, category;

  beforeEach(async () => {
    user = await createTestUser('sanitize@example.com', 'password123');
    category = await createTestCategory(user.user.id, 'Test Category');
  });

  describe('XSS strings in entry fields are stored as plain text', () => {
    it('should store XSS payload as plain text without stripping or executing', async () => {
      const xssPayload = '<script>alert(\'xss\')</script>';

      const createRes = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          amount: 25.00,
          type: 'expense',
          category_id: category.id,
          entry_date: '2024-01-15',
          description: xssPayload,
        });

      expect(createRes.status).toBe(201);

      // Retrieve the entry and verify description is stored exactly as submitted
      const getRes = await request(app)
        .get('/api/entries')
        .set('Authorization', `Bearer ${user.token}`);

      expect(getRes.status).toBe(200);
      const entries = getRes.body.entries || getRes.body;
      const entry = Array.isArray(entries) ? entries[0] : entries;
      expect(entry.description).toBe(xssPayload);
    });
  });

  describe('SQL injection payloads do not cause errors', () => {
    it('should store SQL injection payload as plain text and not affect the database', async () => {
      const sqlInjectionPayload = "'; DROP TABLE users; --";

      const createRes = await request(app)
        .post('/api/entries')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          amount: 30.00,
          type: 'expense',
          category_id: category.id,
          entry_date: '2024-01-15',
          description: sqlInjectionPayload,
        });

      expect(createRes.status).toBe(201);

      // Verify the users table still exists by querying it
      const users = await User.findAll();
      expect(users.length).toBeGreaterThan(0);
    });
  });
});
