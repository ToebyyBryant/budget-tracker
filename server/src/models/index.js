'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Initialise models
const User = require('./User')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const BudgetEntry = require('./BudgetEntry')(sequelize, DataTypes);

// Associations
User.hasMany(BudgetEntry, { foreignKey: 'user_id' });
BudgetEntry.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Category, { foreignKey: 'user_id' });
Category.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(BudgetEntry, { foreignKey: 'category_id' });
BudgetEntry.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = { sequelize, User, Category, BudgetEntry };
