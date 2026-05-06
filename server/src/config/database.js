'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'budget_tracker.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'production' ? false : false, // set to console.log for SQL debugging
});

module.exports = sequelize;
