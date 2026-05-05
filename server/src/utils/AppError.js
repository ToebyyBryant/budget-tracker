'use strict';

/**
 * Custom application error that carries an HTTP status code, a machine-readable
 * error code, a human-readable message, and an optional list of field-level errors.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode  HTTP status code (e.g. 400, 401, 409)
   * @param {string} code        Machine-readable error code (e.g. 'DUPLICATE_EMAIL')
   * @param {string} message     Human-readable description
   * @param {string[]} [fields]  Optional list of field names involved in the error
   */
  constructor(statusCode, code, message, fields = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

module.exports = AppError;
