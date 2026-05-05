'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const chartService = require('../services/chartService');

const router = express.Router();

// All dashboard routes require authentication
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
 * GET /api/dashboard/summary
 * Returns total income, total expenses, net balance, and top-5 expense categories
 * for the authenticated user within the optional date range.
 *
 * Query params: startDate, endDate (ISO 8601)
 */
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await chartService.getDashboardSummary(req.userId, startDate, endDate);
    return res.status(200).json(summary);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * GET /api/dashboard/charts/pie
 * Returns expense totals grouped by category for a pie chart.
 *
 * Query params: startDate, endDate (ISO 8601)
 */
router.get('/charts/pie', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await chartService.getExpensesByCategory(req.userId, startDate, endDate);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * GET /api/dashboard/charts/bar
 * Returns monthly income vs expense totals for the last 6 calendar months.
 */
router.get('/charts/bar', async (req, res) => {
  try {
    const data = await chartService.getMonthlyComparison(req.userId);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * GET /api/dashboard/charts/line
 * Returns cumulative net balance per day for the optional date range.
 *
 * Query params: startDate, endDate (ISO 8601)
 */
router.get('/charts/line', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await chartService.getCumulativeBalance(req.userId, startDate, endDate);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
});

module.exports = router;
