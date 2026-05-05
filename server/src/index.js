'use strict';

require('dotenv').config();

const app = require('./app');
const { sequelize, Category } = require('./models/index');
const { seedDefaultCategories } = require('./config/seeders');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

async function start() {
  // Verify the database connection
  await sequelize.authenticate();
  logger.info({ message: 'Database connection established.' });

  // Sync models to the database (non-destructive; use migrations for schema changes)
  await sequelize.sync({ alter: false });
  logger.info({ message: 'Database models synchronised.' });

  // Seed default categories if they are not already present
  await seedDefaultCategories(Category);
  logger.info({ message: 'Default categories seeded (if needed).' });

  // Start the HTTP server
  app.listen(PORT, () => {
    logger.info({ message: `Server running on port ${PORT}` });
  });
}

start().catch((err) => {
  logger.error({ message: err.message, stack: err.stack });
  process.exit(1);
});
