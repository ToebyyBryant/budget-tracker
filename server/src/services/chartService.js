'use strict';

const { BudgetEntry, Category, sequelize } = require('../models/index');
const { Op, fn, col, literal } = require('sequelize');

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

  const rows = await BudgetEntry.findAll({
    where,
    attributes: [
      'category_id',
      [fn('SUM', col('BudgetEntry.amount')), 'total'],
    ],
    include: [{ model: Category, as: 'Category', attributes: ['name'] }],
    group: ['BudgetEntry.category_id', 'Category.id'],
    order: [[literal('"total"'), 'DESC']],
    raw: false,
  });

  return rows.map((row) => ({
    categoryId: row.category_id,
    name: row.Category ? row.Category.name : 'Unknown',
    total: parseFloat(parseFloat(row.getDataValue('total')).toFixed(2)),
  }));
}

/**
 * Returns monthly income vs expense totals for the last 6 calendar months.
 *
 * @param {number} userId
 * @returns {Promise<Array<{ month: string, income: number, expenses: number }>>}
 */
async function getMonthlyComparison(userId) {
  // Compute the start of 6 months ago (first day of that month)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startDate = sixMonthsAgo.toISOString().slice(0, 10);

  const rows = await BudgetEntry.findAll({
    where: {
      user_id: userId,
      entry_date: { [Op.gte]: startDate },
    },
    attributes: [
      [fn('TO_CHAR', col('entry_date'), 'YYYY-MM'), 'month'],
      'type',
      [fn('SUM', col('amount')), 'total'],
    ],
    group: [literal("TO_CHAR(entry_date, 'YYYY-MM')"), 'type'],
    order: [[literal("TO_CHAR(entry_date, 'YYYY-MM')"), 'ASC']],
    raw: true,
  });

  // Build a map of month -> { income, expenses }
  const monthMap = {};

  // Pre-populate all 6 months with zeros so months with no data still appear
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, income: 0, expenses: 0 };
  }

  for (const row of rows) {
    const month = row.month;
    if (!monthMap[month]) {
      monthMap[month] = { month, income: 0, expenses: 0 };
    }
    const total = parseFloat(row.total);
    if (row.type === 'income') {
      monthMap[month].income = parseFloat((monthMap[month].income + total).toFixed(2));
    } else {
      monthMap[month].expenses = parseFloat((monthMap[month].expenses + total).toFixed(2));
    }
  }

  return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
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
