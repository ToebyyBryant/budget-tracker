const { verifyToken } = require('../utils/jwt');

/**
 * Express middleware that authenticates requests via JWT.
 *
 * Expects the header:  Authorization: Bearer <token>
 *
 * On success, attaches req.userId and calls next().
 * On failure (missing header, malformed header, invalid/expired token),
 * responds with 401 and a standard error envelope.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  }
}

module.exports = { authenticate };
