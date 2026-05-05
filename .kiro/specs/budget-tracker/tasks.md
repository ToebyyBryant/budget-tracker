# Implementation Plan: Budget Tracker

## Overview

Implement a full-stack Budget Tracker application using a Node.js/Express backend with PostgreSQL (Sequelize ORM) and a React (Vite) frontend. The monorepo is structured with `server/` and `client/` packages. Tasks are ordered to build the foundation first (project setup, DB models, auth), then core CRUD features, then the dashboard/charts, and finally the responsive UI shell.

## Tasks

- [x] 1. Initialise monorepo project structure
  - Create `BudgetTracker/server/` and `BudgetTracker/client/` package directories
  - Initialise `package.json` in each package and a root `package.json` with workspaces
  - Add `.gitignore` entries for `node_modules`, `.env`, build artefacts
  - Create `BudgetTracker/server/src/` subdirectories: `config/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/`
  - Create `BudgetTracker/client/src/` subdirectories: `api/`, `components/`, `hooks/`, `pages/`, `utils/`
  - _Requirements: (foundational — all requirements depend on this)_

- [x] 2. Configure backend dependencies and environment
  - Install server dependencies: `express`, `sequelize`, `pg`, `pg-hstore`, `jsonwebtoken`, `bcrypt`, `express-validator`, `cors`, `dotenv`, `winston`
  - Install server dev dependencies: `jest`, `supertest`, `fast-check`, `nodemon`
  - Create `BudgetTracker/server/src/config/database.js` — Sequelize instance reading `DATABASE_URL` from `.env`
  - Create `BudgetTracker/server/src/config/logger.js` — winston logger with JSON format, `warn` for auth failures, `error` for DB errors
  - Create `.env.example` documenting required variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 3. Define Sequelize models and run migrations
  - Create `BudgetTracker/server/src/models/User.js` — fields: `id`, `email` (unique, isEmail), `password_hash`, timestamps
  - Create `BudgetTracker/server/src/models/Category.js` — fields: `id`, `name`, `user_id` (nullable FK), `is_default`; unique constraint on `(name, user_id)`
  - Create `BudgetTracker/server/src/models/BudgetEntry.js` — fields: `id`, `user_id` (FK), `category_id` (FK), `amount` (DECIMAL 12,2, min 0.01), `type` (ENUM income/expense), `entry_date` (DATEONLY), `description` (nullable, max 500)
  - Create `BudgetTracker/server/src/models/index.js` — sets up associations (User hasMany BudgetEntry/Category, Category hasMany BudgetEntry) and exports all models
  - Create Sequelize migration files for all three tables
  - Create `BudgetTracker/server/src/config/seeders.js` — seeds the 7 default categories (`Food`, `Transport`, `Housing`, `Entertainment`, `Healthcare`, `Salary`, `Other`) with `user_id = NULL` and `is_default = true`
  - _Requirements: 3.1, 4.1, 10.3, 10.4_

- [x] 4. Implement JWT auth utilities and middleware
  - Create `BudgetTracker/server/src/utils/jwt.js` — `generateToken(userId)` (24 h expiry) and `verifyToken(token)` using `jsonwebtoken`
  - Create `BudgetTracker/server/src/middleware/auth.js` — extracts `Authorization: Bearer <token>`, calls `verifyToken`, attaches `req.userId`; returns 401 for missing/malformed/expired tokens
  - _Requirements: 2.1, 2.3, 2.5, 10.1_

- [x] 5. Implement Auth Service and routes
  - Create `BudgetTracker/server/src/services/authService.js` with methods: `hashPassword`, `verifyPassword`, `register`, `login`
    - `register`: validates email uniqueness (409 on duplicate), hashes password with bcrypt (salt rounds = 12), creates User, returns `{ user, token }`
    - `login`: looks up user by email, compares password hash, returns `{ user, token }` or throws 401
  - Create `BudgetTracker/server/src/routes/auth.js` — POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout` (auth-protected, client-side invalidation)
  - Add `express-validator` rules: email format, password min-length 8
  - Wire routes into `BudgetTracker/server/src/app.js` (Express app entry point)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.4_

  - [ ]* 5.1 Write property test — Property 1: Registration round-trip
    - **Property 1: Registration round-trip** — for any valid email + password ≥ 8 chars, register returns a JWT and the user exists in DB
    - **Validates: Requirements 1.2**
    - Use `fast-check` arbitraries for email and password strings

  - [ ]* 5.2 Write property test — Property 2: Duplicate email is rejected
    - **Property 2: Duplicate email is rejected** — second registration with same email returns 409 regardless of password
    - **Validates: Requirements 1.3**

  - [ ]* 5.3 Write property test — Property 3: Short passwords are rejected
    - **Property 3: Short passwords are rejected** — any password of length 1–7 returns 400 and no user is created
    - **Validates: Requirements 1.4**

  - [ ]* 5.4 Write property test — Property 4: Passwords never stored in plaintext
    - **Property 4: Passwords never stored in plaintext** — `password_hash` ≠ plaintext; `bcrypt.compare(plaintext, hash)` returns `true`
    - **Validates: Requirements 1.5**

  - [ ]* 5.5 Write property test — Property 5: Login returns a 24-hour JWT
    - **Property 5: Login returns a 24-hour JWT** — for any registered user, `exp - iat === 86400`
    - **Validates: Requirements 2.1**

  - [ ]* 5.6 Write property test — Property 6: Invalid credentials are rejected
    - **Property 6: Invalid credentials are rejected** — unknown email or wrong password returns 401
    - **Validates: Requirements 2.2**

  - [ ]* 5.7 Write property test — Property 23: Protected endpoints reject unauthenticated requests
    - **Property 23: Protected endpoints reject unauthenticated requests** — any protected route without a valid JWT returns 401
    - **Validates: Requirements 10.1**

- [x] 6. Checkpoint — auth layer
  - Ensure all auth tests pass, ask the user if questions arise.

- [x] 7. Implement Category Service and routes
  - Create `BudgetTracker/server/src/services/categoryService.js` with methods: `getCategories`, `createCategory`, `deleteCategory`
    - `getCategories(userId)`: returns default categories (`is_default = true`) plus user-owned categories (`user_id = userId`)
    - `createCategory(userId, name)`: enforces uniqueness per user (409 on duplicate), persists and returns new Category
    - `deleteCategory(userId, categoryId)`: checks ownership, checks for associated BudgetEntries (409 if any exist), deletes
  - Create `BudgetTracker/server/src/routes/categories.js` — GET/POST/DELETE `/api/categories` and `/api/categories/:id`, all protected by auth middleware
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.4_

  - [ ]* 7.1 Write property test — Property 7: Custom category creation round-trip
    - **Property 7: Custom category creation round-trip** — created category appears in subsequent `getCategories` result
    - **Validates: Requirements 3.2**

  - [ ]* 7.2 Write property test — Property 8: Duplicate category name is rejected per user
    - **Property 8: Duplicate category name is rejected per user** — second creation with same name returns 409
    - **Validates: Requirements 3.3**

  - [ ]* 7.3 Write property test — Property 9: Empty category can be deleted
    - **Property 9: Empty category can be deleted** — category with no entries is deleted and no longer in list
    - **Validates: Requirements 3.4**

  - [ ]* 7.4 Write property test — Property 10: Category with entries cannot be deleted
    - **Property 10: Category with entries cannot be deleted** — category with ≥ 1 entry returns 409 on delete
    - **Validates: Requirements 3.5**

  - [ ]* 7.5 Write property test — Property 24: User data is strictly isolated (categories)
    - **Property 24 (categories): User data is strictly isolated** — user B cannot read, modify, or delete user A's categories
    - **Validates: Requirements 3.6, 10.4**

- [x] 8. Implement Budget Service and routes
  - Create `BudgetTracker/server/src/services/budgetService.js` with methods: `createEntry`, `getEntries`, `updateEntry`, `deleteEntry`
    - `createEntry(userId, data)`: validates required fields (400 on missing), validates amount > 0 (400 otherwise), associates with `userId`, persists
    - `getEntries(userId, filters)`: builds dynamic Sequelize `where` clause for `startDate`, `endDate`, `categoryId`, `type`; orders by `entry_date DESC`
    - `updateEntry(userId, entryId, data)`: checks existence (404), checks ownership (403), validates fields, persists changes
    - `deleteEntry(userId, entryId)`: checks existence (404), checks ownership (403), deletes, returns 204
  - Create `BudgetTracker/server/src/routes/entries.js` — GET/POST `/api/entries`, PUT/DELETE `/api/entries/:id`, all protected
  - Add `express-validator` rules for all entry fields
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 10.3, 10.4_

  - [ ]* 8.1 Write property test — Property 11: Budget entry creation round-trip
    - **Property 11: Budget entry creation round-trip** — created entry fields match submitted values and carry a unique integer ID
    - **Validates: Requirements 4.1**

  - [ ]* 8.2 Write property test — Property 12: Missing required fields are rejected
    - **Property 12: Missing required fields are rejected** — any submission missing amount, type, category, or date returns 400
    - **Validates: Requirements 4.2**

  - [ ]* 8.3 Write property test — Property 13: Non-positive amounts are rejected
    - **Property 13: Non-positive amounts are rejected** — amount ≤ 0 returns 400
    - **Validates: Requirements 4.3**

  - [ ]* 8.4 Write property test — Property 14: Entries returned in date-descending order
    - **Property 14: Entries returned in date-descending order** — for any set of entries, result is sorted by `entry_date` DESC
    - **Validates: Requirements 5.1**

  - [ ]* 8.5 Write property test — Property 15: Combined filters return the intersection
    - **Property 15: Combined filters return the intersection** — result of combined filters is a subset of each individual filter's result
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

  - [ ]* 8.6 Write property test — Property 16: Budget entry update round-trip
    - **Property 16: Budget entry update round-trip** — updated fields match submitted values in the returned record
    - **Validates: Requirements 6.1**

  - [ ]* 8.7 Write property test — Property 17: Owned entry deletion succeeds
    - **Property 17: Owned entry deletion succeeds** — deletion returns 204 and entry is no longer retrievable
    - **Validates: Requirements 6.4**

  - [ ]* 8.8 Write property test — Property 24: User data is strictly isolated (entries)
    - **Property 24 (entries): User data is strictly isolated** — user B receives 403 or empty result for user A's entries
    - **Validates: Requirements 4.4, 5.6, 6.2, 6.5, 10.4**

- [x] 9. Checkpoint — CRUD layer
  - Ensure all category and entry tests pass, ask the user if questions arise.

- [x] 10. Implement Chart Service and dashboard routes
  - Create `BudgetTracker/server/src/services/chartService.js` with methods:
    - `getDashboardSummary(userId, startDate, endDate)`: sums income and expense entries for the period, computes net balance, returns top-5 expense categories by total amount
    - `getExpensesByCategory(userId, startDate, endDate)`: aggregates expense amounts per category for pie chart
    - `getMonthlyComparison(userId)`: aggregates income and expense totals per calendar month for the last 6 months for bar chart
    - `getCumulativeBalance(userId, startDate, endDate)`: computes running net balance per day for line chart
  - Create `BudgetTracker/server/src/routes/dashboard.js` — GET `/api/dashboard/summary`, `/api/dashboard/charts/pie`, `/api/dashboard/charts/bar`, `/api/dashboard/charts/line`, all protected
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3_

  - [ ]* 10.1 Write property test — Property 18: Dashboard totals are arithmetically correct
    - **Property 18: Dashboard totals are arithmetically correct** — total income = sum of income amounts; total expenses = sum of expense amounts; net = income − expenses
    - **Validates: Requirements 7.1**

  - [ ]* 10.2 Write property test — Property 19: Top-5 expense categories are correctly ranked
    - **Property 19: Top-5 expense categories are correctly ranked** — result contains min(N, 5) categories ordered by total expense descending
    - **Validates: Requirements 7.3**

  - [ ]* 10.3 Write property test — Property 20: Pie chart data matches per-category expense totals
    - **Property 20: Pie chart data matches per-category expense totals** — each slice value equals category sum; all slices sum to total expenses
    - **Validates: Requirements 8.1**

  - [ ]* 10.4 Write property test — Property 21: Bar chart data matches monthly income/expense aggregations
    - **Property 21: Bar chart data matches monthly income/expense aggregations** — each bar group's income and expense values equal the monthly sums
    - **Validates: Requirements 8.2**

  - [ ]* 10.5 Write property test — Property 22: Line chart data represents correct cumulative balance
    - **Property 22: Line chart data represents correct cumulative balance** — each data point equals the running sum of (income − expense) from period start to that date
    - **Validates: Requirements 8.3**

- [x] 11. Checkpoint — backend complete
  - Ensure all backend tests pass (unit + integration + property), ask the user if questions arise.

- [x] 12. Configure frontend (Vite + React + Tailwind)
  - Scaffold Vite React project in `BudgetTracker/client/`
  - Install client dependencies: `react-router-dom`, `axios`, `chart.js`, `react-chartjs-2`, `tailwindcss`, `postcss`, `autoprefixer`
  - Install client dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@fast-check/vitest`, `jsdom`
  - Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, import in `index.css`)
  - Configure Vitest (`vitest.config.js`) with jsdom environment
  - Create `BudgetTracker/client/src/api/client.js` — Axios instance with `baseURL`, request interceptor to attach JWT from `localStorage`, response interceptor to handle 401 (clear token, redirect to `/login`)
  - _Requirements: 9.1, 9.2, 9.3, 2.4, 2.5, 10.1_

- [x] 13. Implement auth pages and routing
  - Create `BudgetTracker/client/src/pages/RegisterPage.jsx` — form with email and password fields, calls `POST /api/auth/register`, stores JWT in `localStorage`, redirects to dashboard; displays inline validation errors
  - Create `BudgetTracker/client/src/pages/LoginPage.jsx` — form with email and password fields, calls `POST /api/auth/login`, stores JWT, redirects to dashboard; displays 401 error message
  - Create `BudgetTracker/client/src/components/ProtectedRoute.jsx` — HOC that reads JWT from `localStorage`; redirects unauthenticated users to `/login`
  - Create `BudgetTracker/client/src/App.jsx` — React Router routes: `/register`, `/login`, `/` (dashboard, protected), `/entries` (protected)
  - _Requirements: 1.1, 2.1, 2.3, 2.4, 2.5_

  - [ ]* 13.1 Write unit tests for auth pages
    - Test RegisterPage renders fields and submits correctly
    - Test LoginPage shows error on 401 response
    - Test ProtectedRoute redirects unauthenticated users
    - Test logout clears localStorage and redirects to `/login`
    - _Requirements: 2.4, 2.5_

- [x] 14. Implement NavBar with responsive hamburger menu
  - Create `BudgetTracker/client/src/components/NavBar.jsx` — navigation links (Dashboard, Entries, Categories, Logout); hamburger toggle visible at viewport < 768 px using Tailwind `md:hidden`; logout calls `POST /api/auth/logout` and clears localStorage
  - _Requirements: 9.2, 9.3, 2.4_

  - [ ]* 14.1 Write unit test for NavBar responsive behaviour
    - Test hamburger menu renders at < 768 px viewport width
    - Test navigation links are visible on desktop viewport
    - _Requirements: 9.3_

- [x] 15. Implement Category Manager page
  - Create `BudgetTracker/client/src/api/categories.js` — `getCategories()`, `createCategory(name)`, `deleteCategory(id)` using the Axios client
  - Create `BudgetTracker/client/src/pages/CategoryManager.jsx` — lists categories, form to add a new category, delete button (disabled for default categories); displays 409 conflict messages inline
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 15.1 Write unit tests for CategoryManager
    - Test category list renders correctly
    - Test create form submits and updates list
    - Test delete shows error when category is in use
    - _Requirements: 3.3, 3.5_

- [x] 16. Implement Entries page with filters
  - Create `BudgetTracker/client/src/api/entries.js` — `getEntries(filters)`, `createEntry(data)`, `updateEntry(id, data)`, `deleteEntry(id)` using the Axios client
  - Create `BudgetTracker/client/src/components/EntryForm.jsx` — modal form for create/edit with fields: amount, type (income/expense), category (dropdown), date, description; inline validation errors
  - Create `BudgetTracker/client/src/pages/EntriesPage.jsx` — paginated list of entries ordered by date descending; filter controls for date range, category, and type; Edit and Delete buttons per row; opens EntryForm modal
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.3, 6.4_

  - [ ]* 16.1 Write unit tests for EntryForm
    - Test form renders all required fields
    - Test validation errors display for missing/invalid fields
    - Test form submits correct payload
    - _Requirements: 4.2, 4.3_

  - [ ]* 16.2 Write unit tests for EntriesPage
    - Test entries render in date-descending order
    - Test filter controls update the displayed list
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 17. Implement frontend utility functions for chart data transformation
  - Create `BudgetTracker/client/src/utils/chartUtils.js` — pure functions:
    - `buildPieData(entries)`: groups expense entries by category, returns Chart.js dataset
    - `buildBarData(entries)`: groups entries by month (last 6 months), returns income/expense bar dataset
    - `buildLineData(entries)`: computes cumulative balance per day, returns line dataset
    - `computeSummary(entries)`: returns `{ totalIncome, totalExpenses, netBalance, top5Categories }`
  - _Requirements: 7.1, 7.3, 8.1, 8.2, 8.3_

  - [ ]* 17.1 Write property test — Property 18 (frontend): Dashboard totals are arithmetically correct
    - **Property 18 (frontend): Dashboard totals are arithmetically correct** — `computeSummary` returns correct sums and net balance for any entry set
    - **Validates: Requirements 7.1**

  - [ ]* 17.2 Write property test — Property 19 (frontend): Top-5 expense categories are correctly ranked
    - **Property 19 (frontend): Top-5 expense categories are correctly ranked** — `computeSummary` top5 contains min(N, 5) categories ordered by total descending
    - **Validates: Requirements 7.3**

  - [ ]* 17.3 Write property test — Property 20 (frontend): Pie chart data matches per-category expense totals
    - **Property 20 (frontend): Pie chart data matches per-category expense totals** — each slice value equals category sum; all slices sum to total expenses
    - **Validates: Requirements 8.1**

  - [ ]* 17.4 Write property test — Property 21 (frontend): Bar chart data matches monthly aggregations
    - **Property 21 (frontend): Bar chart data matches monthly income/expense aggregations** — each bar group's values equal monthly sums
    - **Validates: Requirements 8.2**

  - [ ]* 17.5 Write property test — Property 22 (frontend): Line chart data represents correct cumulative balance
    - **Property 22 (frontend): Line chart data represents correct cumulative balance** — each data point equals running sum of (income − expense) from period start
    - **Validates: Requirements 8.3**

  - [ ]* 17.6 Write property test — Property 15 (frontend): Combined filters return the intersection
    - **Property 15 (frontend): Combined filters return the intersection** — client-side filter logic returns only entries satisfying all active conditions
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [x] 18. Implement Dashboard page with charts and summary cards
  - Create `BudgetTracker/client/src/api/dashboard.js` — `getSummary(params)`, `getPieData(params)`, `getBarData()`, `getLineData(params)` using the Axios client
  - Create `BudgetTracker/client/src/components/SummaryCard.jsx` — displays a single KPI (label + formatted value)
  - Create `BudgetTracker/client/src/components/PeriodSelector.jsx` — date-range picker that emits `{ startDate, endDate }` on change
  - Create `BudgetTracker/client/src/components/PieChart.jsx` — wraps `react-chartjs-2` Pie; shows placeholder message when dataset is empty
  - Create `BudgetTracker/client/src/components/BarChart.jsx` — wraps `react-chartjs-2` Bar; shows placeholder when empty
  - Create `BudgetTracker/client/src/components/LineChart.jsx` — wraps `react-chartjs-2` Line; shows placeholder when empty
  - Create `BudgetTracker/client/src/pages/DashboardPage.jsx` — hosts PeriodSelector, three SummaryCards (total income, total expenses, net balance), top-5 category list, PieChart, BarChart, LineChart; re-fetches all data when period changes; shows empty-state prompt when no entries exist
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 18.1 Write unit tests for chart components
    - Test PieChart renders placeholder when dataset is empty
    - Test BarChart renders placeholder when dataset is empty
    - Test LineChart renders placeholder when dataset is empty
    - _Requirements: 8.5_

  - [ ]* 18.2 Write unit tests for DashboardPage
    - Test summary cards display zero values and prompt when no entries exist
    - Test period change triggers data re-fetch
    - _Requirements: 7.4, 7.2_

- [x] 19. Checkpoint — frontend complete
  - Ensure all frontend tests pass (unit + property), ask the user if questions arise.

- [x] 20. Wire backend app entry point and error handling
  - Create `BudgetTracker/server/src/app.js` — mounts all routers (`/api/auth`, `/api/categories`, `/api/entries`, `/api/dashboard`), applies CORS, JSON body parser, and global error handler middleware
  - Create `BudgetTracker/server/src/middleware/errorHandler.js` — catches errors thrown by services, maps them to the standard JSON error envelope `{ error: { code, message, fields } }`, logs 5xx errors with winston
  - Create `BudgetTracker/server/src/index.js` — connects Sequelize, runs seeders if default categories are absent, starts Express server on `PORT`
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 21. Integration tests for cross-cutting concerns
  - Write Supertest integration tests in `BudgetTracker/server/tests/integration/`:
    - Auth enforcement: every protected route returns 401 without a valid JWT
    - Cross-user isolation: user B cannot access user A's entries or categories (403 / empty)
    - Input sanitisation: XSS strings and SQL injection payloads in entry fields are stored as plain text and do not cause errors
  - _Requirements: 10.1, 10.3, 10.4_

- [x] 22. Final checkpoint — full application
  - Ensure all tests pass across both packages (backend unit, backend integration, backend property, frontend unit, frontend property), ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 6, 9, 11, 19, and 22 ensure incremental validation
- Property tests validate universal correctness guarantees; unit/integration tests validate specific scenarios and edge cases
- The `fast-check` global config (`numRuns: 100`) should be set in `BudgetTracker/server/tests/setup.js` and `BudgetTracker/client/src/tests/setup.js`
- A separate `budget_tracker_test` PostgreSQL database should be used for integration tests, with migrations run before the suite and tables truncated between tests
