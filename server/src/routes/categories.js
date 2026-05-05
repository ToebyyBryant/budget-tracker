'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const categoryService = require('../services/categoryService');

const router = express.Router();

// All category routes require authentication
router.use(authenticate);

/**
 * GET /api/categories
 * Returns all categories visible to the authenticated user
 * (default categories + user-owned categories).
 */
router.get('/', async (req, res) => {
  try {
    const categories = await categoryService.getCategories(req.userId);
    return res.status(200).json(categories);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: { code: err.code, message: err.message, fields: err.fields },
      });
    }
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', fields: [] },
    });
  }
});

/**
 * POST /api/categories
 * Creates a new category for the authenticated user.
 * Body: { name: string }
 */
router.post(
  '/',
  [body('name').notEmpty().withMessage('Name is required.').trim()],
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
      const { name } = req.body;
      const category = await categoryService.createCategory(req.userId, name);
      return res.status(201).json(category);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          error: { code: err.code, message: err.message, fields: err.fields },
        });
      }
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', fields: [] },
      });
    }
  }
);

/**
 * DELETE /api/categories/:id
 * Deletes a user-owned category (must have no associated budget entries).
 */
router.delete('/:id', async (req, res) => {
  try {
    await categoryService.deleteCategory(req.userId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: { code: err.code, message: err.message, fields: err.fields },
      });
    }
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', fields: [] },
    });
  }
});

module.exports = router;
