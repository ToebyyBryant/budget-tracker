'use strict';

const logger = require('../config/logger');

/**
 * Global Express error-handling middleware.
 * Must be registered LAST (after all routes) in app.js.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  // AppError — known, intentional errors thrown by the service layer
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields || [],
      },
    });
  }

  // Sequelize model-level validation failure
  if (err.name === 'SequelizeValidationError') {
    const fields = err.errors ? err.errors.map((e) => e.path) : [];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        fields,
      },
    });
  }

  // Sequelize unique-constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors ? err.errors.map((e) => e.path) : [];
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A record with the given value already exists.',
        fields,
      },
    });
  }

  // Unexpected / unhandled error — log it, return a generic 500
  logger.error({ message: err.message, stack: err.stack });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      fields: [],
    },
  });
}

module.exports = errorHandler;
