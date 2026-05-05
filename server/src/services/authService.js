'use strict';

const bcrypt = require('bcrypt');
const { User } = require('../models/index');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} plaintext
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param {string} plaintext
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Registers a new user.
 *
 * @param {string} email
 * @param {string} password  Plaintext password (already validated for length by the route)
 * @returns {Promise<{ user: { id: number, email: string }, token: string }>}
 * @throws {AppError} 409 DUPLICATE_EMAIL if the email is already registered
 */
async function register(email, password) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AppError(409, 'DUPLICATE_EMAIL', 'An account with this email address already exists.', ['email']);
  }

  const password_hash = await hashPassword(password);
  const user = await User.create({ email, password_hash });

  const token = generateToken(user.id);

  return {
    user: { id: user.id, email: user.email },
    token,
  };
}

/**
 * Authenticates an existing user.
 *
 * @param {string} email
 * @param {string} password  Plaintext password
 * @returns {Promise<{ user: { id: number, email: string }, token: string }>}
 * @throws {AppError} 401 INVALID_CREDENTIALS if email not found or password is wrong
 */
async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const token = generateToken(user.id);

  return {
    user: { id: user.id, email: user.email },
    token,
  };
}

module.exports = { hashPassword, verifyPassword, register, login };
