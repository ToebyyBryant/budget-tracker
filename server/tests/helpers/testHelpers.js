'use strict';

const bcrypt = require('bcrypt');
const { User, Category, BudgetEntry, sequelize } = require('../../src/models/index');
const { generateToken } = require('../../src/utils/jwt');

/**
 * Creates a test user with a hashed password and returns the user and a valid JWT.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
async function createTestUser(email = 'testuser@example.com', password = 'password123') {
  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password_hash });
  const token = generateToken(user.id);
  return { user, token };
}

/**
 * Creates a test category for the given user.
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<object>}
 */
async function createTestCategory(userId, name = 'Test Category') {
  return Category.create({ name, user_id: userId, is_default: false });
}

/**
 * Creates a test budget entry with sensible defaults.
 * @param {number} userId
 * @param {number} categoryId
 * @param {object} data - Override fields
 * @returns {Promise<object>}
 */
async function createTestEntry(userId, categoryId, data = {}) {
  const defaults = {
    user_id: userId,
    category_id: categoryId,
    amount: 100.00,
    type: 'expense',
    entry_date: '2024-01-15',
    description: 'Test entry',
  };
  return BudgetEntry.create({ ...defaults, ...data });
}

/**
 * Truncates all tables to reset the database between tests.
 * Deletes entries first (FK constraints), then non-default categories, then users.
 */
async function cleanDatabase() {
  await BudgetEntry.destroy({ where: {}, truncate: true, cascade: true });
  await Category.destroy({ where: { is_default: false } });
  await User.destroy({ where: {}, truncate: true, cascade: true });
}

module.exports = {
  createTestUser,
  createTestCategory,
  createTestEntry,
  cleanDatabase,
};
