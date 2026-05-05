'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const budgetService = require('../services/budgetService');

const router = express.Router();

// All entry routes require authentication
router.use(authenticate);

/**
 * Helper to send a consistent error response for AppErrors and unexpected errors.
 */
function handleError(err, res) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
  }
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', fields: [] },
  });
}

/**
 * GET /api/entries
 * Returns budget entries for the authenticated user, with optional filters.
 * Query params: startDate, endDate, categoryId, type
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, categoryId, type } = req.query;
    const entries = await budgetService.getEntries(req.userId, {
      startDate,
      endDate,
      categoryId,
      type,
    });
    return res.status(200).json(entries);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * POST /api/entries
 * Creates a new budget entry for the authenticated user.
 * Body: { amount, type, category_id, entry_date, description? }
 */
router.post(
  '/',
  [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a number greater than zero.'),
    body('type')
      .isIn(['income', 'expense'])
      .withMessage("Type must be 'income' or 'expense'."),
    body('category_id')
      .isInt()
      .withMessage('category_id must be an integer.'),
    body('entry_date')
      .isISO8601()
      .withMessage('entry_date must be a valid ISO 8601 date.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          fields: errors.array().map((e) => e.path || e.param),
        },
      });
    }

    try {
      const { amount, type, category_id, entry_date, description } = req.body;
      const entry = await budgetService.createEntry(req.userId, {
        amount,
        type,
        category_id,
        entry_date,
        description,
      });
      return res.status(201).json(entry);
    } catch (err) {
      return handleError(err, res);
    }
  }
);

/**
 * PUT /api/entries/:id
 * Updates an existing budget entry owned by the authenticated user.
 * Body: partial { amount?, type?, category_id?, entry_date?, description? }
 */
router.put(
  '/:id',
  [
    body('amount')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Amount must be a number greater than zero.'),
    body('type')
      .optional()
      .isIn(['income', 'expense'])
      .withMessage("Type must be 'income' or 'expense'."),
    body('category_id')
      .optional()
      .isInt()
      .withMessage('category_id must be an integer.'),
    body('entry_date')
      .optional()
      .isISO8601()
      .withMessage('entry_date must be a valid ISO 8601 date.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          fields: errors.array().map((e) => e.path || e.param),
        },
      });
    }

    try {
      const entry = await budgetService.updateEntry(req.userId, req.params.id, req.body);
      return res.status(200).json(entry);
    } catch (err) {
      return handleError(err, res);
    }
  }
);

/**
 * DELETE /api/entries/:id
 * Deletes a budget entry owned by the authenticated user.
 */
router.delete('/:id', async (req, res) => {
  try {
    await budgetService.deleteEntry(req.userId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res);
  }
});

module.exports = router;
