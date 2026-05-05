'use strict';

const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

const router = Router();

// ---------------------------------------------------------------------------
// Validation rule sets
// ---------------------------------------------------------------------------

const registerRules = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.'),
];

const loginRules = [
  body('email')
    .notEmpty()
    .withMessage('Email is required.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

// ---------------------------------------------------------------------------
// Helper: turn express-validator errors into the standard error envelope
// ---------------------------------------------------------------------------

function formatValidationErrors(errors) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      fields: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

router.post('/register', registerRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(formatValidationErrors(errors));
  }

  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    return res.status(201).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: { code: err.code, message: err.message, fields: err.fields },
      });
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

router.post('/login', loginRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(formatValidationErrors(errors));
  }

  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: { code: err.code, message: err.message, fields: err.fields },
      });
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /logout  (protected — client is responsible for discarding the token)
// ---------------------------------------------------------------------------

router.post('/logout', authenticate, (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully.' });
});

module.exports = router;
