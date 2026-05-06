# Budget Tracker — Presentation Outline

**Course:** Advanced Technologies — Spring 2026  
**Duration:** 5–10 minutes  
**Format:** Slides + Live Demo + Code Walkthrough

---

## Slide 1: Title

**Budget Tracker — Full-Stack CRUD Application**

- Advanced Technologies, Spring 2026
- Tech: Node.js, React, SQLite, JWT Auth, Chart.js

---

## Slide 2: Problem & Solution

**Problem:**
- People struggle to track where their money goes
- Spreadsheets are tedious and lack visualization
- Need a secure, personal finance tool

**Solution:**
- Full-stack web app with CRUD operations, categories, charts, and user authentication

---

## Slide 3: Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Node.js + Express | Fast, lightweight, huge ecosystem |
| Database | SQLite + Sequelize ORM | Zero-config, portable, relational |
| Auth | JWT + bcrypt | Stateless, secure password hashing |
| Frontend | React (Vite) | Component model, fast HMR |
| Charts | Chart.js | Pie, bar, line — all built-in |
| Styling | Tailwind CSS | Utility-first, responsive |

---

## Slide 4: Architecture

```
Browser → React SPA (5173) → Express API (3001) → JWT Middleware → Service Layer → SQLite DB
```

- MVC Pattern: Routes → Services → Models
- Monorepo: `server/` and `client/` packages
- Vite proxies `/api` requests to the backend

---

## Slide 5: Database Design

**Three tables with foreign key relationships:**

- **Users** — id, email (unique), password_hash, timestamps
- **Categories** — id, name, user_id (FK, nullable for defaults), is_default, unique(name, user_id)
- **Budget Entries** — id, user_id (FK), category_id (FK), amount, type (income/expense), entry_date, description

**Relationships:**
- User has many Entries and Categories
- Category has many Entries

---

## Slide 6: RESTful API Design

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Get JWT token |
| GET/POST/DELETE | /api/categories | Manage categories |
| GET/POST/PUT/DELETE | /api/entries | CRUD budget entries |
| GET | /api/dashboard/* | Summary + chart data |

All endpoints (except auth) require `Authorization: Bearer <token>`

---

## Slide 7: Authentication Flow

1. User registers → password hashed with bcrypt (12 rounds) → stored in DB
2. Server returns signed JWT (24h expiry)
3. Every request includes `Authorization: Bearer <token>`
4. Middleware verifies token → attaches `req.userId`
5. Services enforce ownership — users can only access their own data

**Key point:** Passwords are NEVER stored in plaintext

---

## Slide 8: Security Features

- bcrypt password hashing (12 salt rounds)
- JWT stateless authentication (24h expiry)
- User data isolation — 403 on cross-user access
- Input validation via express-validator on all routes
- SQL injection safe — Sequelize parameterized queries
- Consistent JSON error envelope on all failures

---

## Slide 9: Frontend Features

- **Dashboard** — Summary cards (income, expenses, balance) + 3 chart types
- **Entries** — Full CRUD with filters (date range, category, type)
- **Categories** — Default + custom, deletion guards when in use
- **Responsive** — Works 320px to 2560px, hamburger menu on mobile
- **Real-time** — Charts refresh without page reload
- **Error handling** — Inline validation, contextual error messages

---

## Slide 10: Code Walkthrough

**Show the service layer pattern:**

```javascript
// server/src/services/budgetService.js
async function createEntry(userId, data) {
  const { amount, type, category_id, entry_date } = data;

  if (Number(amount) <= 0) {
    throw new AppError(400, 'INVALID_AMOUNT', 'Amount must be greater than zero.');
  }

  return BudgetEntry.create({
    user_id: userId,
    amount, type, category_id, entry_date,
    description: data.description || null,
  });
}
```

**Talking point:** Clean separation — Routes validate input → Services enforce business rules → Models persist data

---

## Slide 11: MVC Pattern

| Layer | Responsibility | Files |
|-------|---------------|-------|
| Model | DB schema, associations, constraints | `server/src/models/` |
| View | React components, Chart.js, Tailwind UI | `client/src/` |
| Controller | Express routes, service layer, validation | `server/src/routes/` + `services/` |

Each layer has a single responsibility — easy to test and maintain.

---

## Slide 12: Live Demo (2–3 minutes)

**Demo script:**
1. Open http://localhost:5173
2. Register a new account
3. Add 2–3 income entries and 3–4 expense entries across different categories
4. Show the dashboard — summary cards update, charts populate
5. Filter entries by date range and category
6. Show responsive design — resize browser to mobile width
7. (Optional) Show 401 response in DevTools when token is removed

---

## Slide 13: Project Stats

| Metric | Value |
|--------|-------|
| Backend source files | ~15 |
| Frontend components/pages | ~20 |
| API endpoints | 14 routes |
| Database tables | 3 |
| Integration tests | Auth enforcement, user isolation, input sanitization |
| Chart types | Pie, Bar, Line |

---

## Slide 14: Key Takeaways

What I learned building this project:
- Full-stack architecture from database to UI
- JWT authentication and authorization patterns
- RESTful API design with proper error handling
- Sequelize ORM for database abstraction
- React component composition and state management
- Data visualization with Chart.js
- Responsive design with Tailwind CSS

---

## Slide 15: Questions

**GitHub:** github.com/ToebyyBryant/budget-tracker

**Stack:** Node.js • Express • SQLite • Sequelize • React • Vite • Chart.js • Tailwind • JWT

---

## Presenter Notes

### Before the presentation:
1. Make sure both servers are running:
   - `cd server && node src/index.js` (port 3001)
   - `cd client && npx vite` (port 5173)
2. Open http://localhost:5173 in a browser tab ready for the demo
3. Have VS Code open to `server/src/services/budgetService.js` for the code walkthrough

### Timing guide:
- Slides 1–3: ~1 minute (intro + tech stack)
- Slides 4–8: ~2 minutes (architecture + security)
- Slides 9–11: ~1.5 minutes (features + code + MVC)
- Slide 12: ~2–3 minutes (live demo)
- Slides 13–15: ~1 minute (stats + takeaways + questions)

### If asked about testing:
- Integration tests cover auth enforcement (all 11 protected endpoints reject without JWT)
- Cross-user isolation tests (User B can't access User A's data)
- Input sanitization tests (XSS and SQL injection payloads stored safely)
- Frontend utility functions have unit tests for chart data transformations
