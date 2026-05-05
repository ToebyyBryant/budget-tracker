'use strict';

const { Category, BudgetEntry } = require('../models/index');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');

/**
 * Returns all categories visible to the given user:
 * default categories (is_default = true) plus user-owned categories (user_id = userId).
 *
 * @param {number} userId
 * @returns {Promise<Category[]>}
 */
async function getCategories(userId) {
  return Category.findAll({
    where: {
      [Op.or]: [
        { is_default: true },
        { user_id: userId },
      ],
    },
    order: [['name', 'ASC']],
  });
}

/**
 * Creates a new category for the given user.
 * Throws 409 if a category with the same name already exists for this user.
 *
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<Category>}
 */
async function createCategory(userId, name) {
  const existing = await Category.findOne({
    where: { user_id: userId, name },
  });

  if (existing) {
    throw new AppError(409, 'DUPLICATE_CATEGORY', 'A category with this name already exists.', ['name']);
  }

  return Category.create({ name, user_id: userId, is_default: false });
}

/**
 * Deletes a user-owned category.
 * Throws 404 if the category does not exist.
 * Throws 403 if the category does not belong to the user (including default categories).
 * Throws 409 if the category has associated budget entries.
 *
 * @param {number} userId
 * @param {number|string} categoryId
 * @returns {Promise<void>}
 */
async function deleteCategory(userId, categoryId) {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new AppError(404, 'NOT_FOUND', 'Category not found.');
  }

  if (category.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this category.');
  }

  const entryCount = await BudgetEntry.count({
    where: { category_id: categoryId },
  });

  if (entryCount > 0) {
    throw new AppError(409, 'CATEGORY_IN_USE', 'This category is in use and cannot be deleted.');
  }

  await category.destroy();
}

module.exports = { getCategories, createCategory, deleteCategory };
