'use strict';

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'budget_tracker.sqlite');

// Ensure the directory exists before SQLite tries to create the file
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'production' ? false : false, // set to console.log for SQL debugging
});

module.exports = sequelize;
