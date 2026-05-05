'use strict';

const { BudgetEntry, Category } = require('../models/index');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

/**
 * Creates a new budget entry for the given user.
 *
 * @param {number} userId
 * @param {{ amount: number, type: string, category_id: number, entry_date: string, description?: string }} data
 * @returns {Promise<BudgetEntry>}
 */
async function createEntry(userId, data) {
  const { amount, type, category_id, entry_date, description } = data;

  // Validate required fields
  if (!category_id || !entry_date) {
    throw new AppError(400, 'MISSING_FIELDS', 'category_id and entry_date are required.', [
      ...(!category_id ? ['category_id'] : []),
      ...(!entry_date ? ['entry_date'] : []),
    ]);
  }

  // Validate amount
  if (amount === undefined || amount === null || Number(amount) <= 0) {
    throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than zero.', ['amount']);
  }

  // Validate type
  if (!['income', 'expense'].includes(type)) {
    throw new AppError(400, 'INVALID_TYPE', "Type must be 'income' or 'expense'.", ['type']);
  }

  const entry = await BudgetEntry.create({
    user_id: userId,
    amount,
    type,
    category_id,
    entry_date,
    description: description || null,
  });

  return entry;
}

/**
 * Returns budget entries for the given user, optionally filtered.
 *
 * @param {number} userId
 * @param {{ startDate?: string, endDate?: string, categoryId?: number, type?: string }} filters
 * @returns {Promise<BudgetEntry[]>}
 */
async function getEntries(userId, filters = {}) {
  const { startDate, endDate, categoryId, type } = filters;

  const where = { user_id: userId };

  if (startDate && endDate) {
    where.entry_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.entry_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.entry_date = { [Op.lte]: endDate };
  }

  if (categoryId) {
    where.category_id = categoryId;
  }

  if (type) {
    where.type = type;
  }

  return BudgetEntry.findAll({
    where,
    order: [['entry_date', 'DESC']],
    include: [{ model: Category, as: 'Category' }],
  });
}

/**
 * Updates an existing budget entry.
 * Throws 404 if not found, 403 if not owned by the user.
 *
 * @param {number} userId
 * @param {number|string} entryId
 * @param {Partial<{ amount: number, type: string, category_id: number, entry_date: string, description: string }>} data
 * @returns {Promise<BudgetEntry>}
 */
async function updateEntry(userId, entryId, data) {
  const entry = await BudgetEntry.findByPk(entryId);

  if (!entry) {
    throw new AppError(404, 'NOT_FOUND', 'Budget entry not found.');
  }

  if (entry.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this entry.');
  }

  // Validate amount if provided
  if (data.amount !== undefined && data.amount !== null) {
    if (Number(data.amount) <= 0) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than zero.', ['amount']);
    }
  }

  // Validate type if provided
  if (data.type !== undefined && !['income', 'expense'].includes(data.type)) {
    throw new AppError(400, 'INVALID_TYPE', "Type must be 'income' or 'expense'.", ['type']);
  }

  await entry.update(data);
  return entry;
}

/**
 * Deletes a budget entry.
 * Throws 404 if not found, 403 if not owned by the user.
 *
 * @param {number} userId
 * @param {number|string} entryId
 * @returns {Promise<void>}
 */
async function deleteEntry(userId, entryId) {
  const entry = await BudgetEntry.findByPk(entryId);

  if (!entry) {
    throw new AppError(404, 'NOT_FOUND', 'Budget entry not found.');
  }

  if (entry.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this entry.');
  }

  await entry.destroy();
}

module.exports = { createEntry, getEntries, updateEntry, deleteEntry };
