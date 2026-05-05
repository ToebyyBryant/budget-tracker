'use strict';

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const categoriesRouter = require('./routes/categories');
const entriesRouter = require('./routes/entries');
const dashboardRouter = require('./routes/dashboard');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/dashboard', dashboardRouter);

// ---------------------------------------------------------------------------
// Global error handler — must be last
// ---------------------------------------------------------------------------

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Export — app.listen is called in index.js, not here
// ---------------------------------------------------------------------------

module.exports = app;
