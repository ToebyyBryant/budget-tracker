'use strict';

const { BudgetEntry, Category, sequelize } = require('../models/index');
const { Op } = require('sequelize');

/**
 * Builds a Sequelize date where clause for entry_date filtering.
 *
 * @param {string|undefined} startDate
 * @param {string|undefined} endDate
 * @returns {object} Sequelize where condition for entry_date (may be empty)
 */
function buildDateWhere(startDate, endDate) {
  if (startDate && endDate) {
    return { [Op.between]: [startDate, endDate] };
  }
  if (startDate) {
    return { [Op.gte]: startDate };
  }
  if (endDate) {
    return { [Op.lte]: endDate };
  }
  return undefined;
}

/**
 * Returns a dashboard summary for the given user and optional date range.
 *
 * @param {number} userId
 * @param {string|undefined} startDate  ISO 8601 date string
 * @param {string|undefined} endDate    ISO 8601 date string
 * @returns {Promise<{
 *   totalIncome: number,
 *   totalExpenses: number,
 *   netBalance: number,
 *   top5Categories: Array<{ categoryId: number, name: string, total: number }>
 * }>}
 */
async function getDashboardSummary(userId, startDate, endDate) {
  const where = { user_id: userId };
  const dateWhere = buildDateWhere(startDate, endDate);
  if (dateWhere) {
    where.entry_date = dateWhere;
  }

  const entries = await BudgetEntry.findAll({
    where,
    include: [{ model: Category, as: 'Category' }],
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = {};

  for (const entry of entries) {
    const amount = parseFloat(entry.amount);
    if (entry.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
      const catId = entry.category_id;
      const catName = entry.Category ? entry.Category.name : 'Unknown';
      if (!categoryTotals[catId]) {
        categoryTotals[catId] = { categoryId: catId, name: catName, total: 0 };
      }
      categoryTotals[catId].total += amount;
    }
  }

  const netBalance = totalIncome - totalExpenses;

  const top5Categories = Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({ categoryId: c.categoryId, name: c.name, total: parseFloat(c.total.toFixed(2)) }));

  return {
    totalIncome: parseFloat(totalIncome.toFixed(2)),
    totalExpenses: parseFloat(totalExpenses.toFixed(2)),
    netBalance: parseFloat(netBalance.toFixed(2)),
    top5Categories,
  };
}

/**
 * Returns expense totals grouped by category for a pie chart.
 * Uses in-memory aggregation for SQLite compatibility.
 *
 * @param {number} userId
 * @param {string|undefined} startDate
 * @param {string|undefined} endDate
 * @returns {Promise<Array<{ categoryId: number, name: string, total: number }>>}
 */
async function getExpensesByCategory(userId, startDate, endDate) {
  const where = { user_id: userId, type: 'expense' };
  const dateWhere = buildDateWhere(startDate, endDate);
  if (dateWhere) {
    where.entry_date = dateWhere;
  }

  const entries = await BudgetEntry.findAll({
    where,
    include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }],
    raw: false,
  });

  // Aggregate in memory
  const categoryTotals = {};
  for (const entry of entries) {
    const catId = entry.category_id;
    const catName = entry.Category ? entry.Category.name : 'Unknown';
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { categoryId: catId, name: catName, total: 0 };
    }
    categoryTotals[catId].total += parseFloat(entry.amount);
  }

  return Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ categoryId: c.categoryId, name: c.name, total: parseFloat(c.total.toFixed(2)) }));
}

/**
 * Returns monthly income vs expense totals for the last 6 calendar months.
 * Uses in-memory grouping for SQLite compatibility (no TO_CHAR).
 *
 * @param {number} userId
 * @returns {Promise<Array<{ month: string, income: number, expenses: number }>>}
 */
async function getMonthlyComparison(userId) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startDate = sixMonthsAgo.toISOString().slice(0, 10);

  const entries = await BudgetEntry.findAll({
    where: {
      user_id: userId,
      entry_date: { [Op.gte]: startDate },
    },
    attributes: ['entry_date', 'type', 'amount'],
    raw: true,
  });

  // Build a map of month -> { income, expenses }
  const monthMap = {};

  // Pre-populate all 6 months with zeros
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, income: 0, expenses: 0 };
  }

  // Group entries by month in memory
  for (const entry of entries) {
    const monthKey = entry.entry_date.substring(0, 7); // YYYY-MM
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { month: monthKey, income: 0, expenses: 0 };
    }
    const amount = parseFloat(entry.amount);
    if (entry.type === 'income') {
      monthMap[monthKey].income += amount;
    } else {
      monthMap[monthKey].expenses += amount;
    }
  }

  // Round values
  return Object.values(monthMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      month: m.month,
      income: parseFloat(m.income.toFixed(2)),
      expenses: parseFloat(m.expenses.toFixed(2)),
    }));
}

/**
 * Returns the cumulative net balance per day for the given period.
 *
 * @param {number} userId
 * @param {string|undefined} startDate
 * @param {string|undefined} endDate
 * @returns {Promise<Array<{ date: string, balance: number }>>}
 */
async function getCumulativeBalance(userId, startDate, endDate) {
  const where = { user_id: userId };
  const dateWhere = buildDateWhere(startDate, endDate);
  if (dateWhere) {
    where.entry_date = dateWhere;
  }

  const entries = await BudgetEntry.findAll({
    where,
    attributes: ['entry_date', 'type', 'amount'],
    order: [['entry_date', 'ASC']],
    raw: true,
  });

  // Group net amounts by date
  const dailyNet = {};
  for (const entry of entries) {
    const date = entry.entry_date;
    const amount = parseFloat(entry.amount);
    const delta = entry.type === 'income' ? amount : -amount;
    dailyNet[date] = (dailyNet[date] || 0) + delta;
  }

  // Build cumulative balance array
  const result = [];
  let runningBalance = 0;
  const sortedDates = Object.keys(dailyNet).sort();

  for (const date of sortedDates) {
    runningBalance += dailyNet[date];
    result.push({ date, balance: parseFloat(runningBalance.toFixed(2)) });
  }

  return result;
}

module.exports = {
  getDashboardSummary,
  getExpensesByCategory,
  getMonthlyComparison,
  getCumulativeBalance,
};
