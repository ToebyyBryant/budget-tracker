const jwt = require('jsonwebtoken');

/**
 * Signs a JWT with payload { userId }, expires in 24 hours.
 * @param {number|string} userId
 * @returns {string} signed JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies and decodes a JWT. Returns the payload on success.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {{ userId: number|string, iat: number, exp: number }}
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
