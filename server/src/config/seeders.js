'use strict';

const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Healthcare',
  'Salary',
  'Other',
];

/**
 * Seeds the default categories if none exist yet.
 * @param {import('../models/Category')} Category - The Sequelize Category model
 */
async function seedDefaultCategories(Category) {
  const existingCount = await Category.count({ where: { is_default: true } });

  if (existingCount > 0) {
    return; // Already seeded
  }

  const records = DEFAULT_CATEGORIES.map((name) => ({
    name,
    user_id: null,
    is_default: true,
  }));

  await Category.bulkCreate(records);
}

module.exports = { seedDefaultCategories };
