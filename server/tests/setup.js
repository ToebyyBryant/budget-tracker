'use strict';

// Set environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/budget_tracker_test';

// Configure fast-check global settings
const fc = require('fast-check');
fc.configureGlobal({ numRuns: 100, verbose: true });
