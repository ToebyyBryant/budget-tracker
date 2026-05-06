# Budget Tracker

A full-stack web application for tracking personal income and expenses. Built with Node.js/Express, SQLite, and React — demonstrating MVC architecture, relational DB design, RESTful API patterns, and modern UI skills.

## Features

- **User Authentication** — JWT-based registration, login, and protected routes
- **Budget Entries** — Full CRUD for income and expense transactions
- **Categories** — Default + custom user-defined categories
- **Dashboard** — Monthly summary with total income, expenses, and net balance
- **Charts** — Pie (expenses by category), Bar (monthly income vs expenses), Line (cumulative balance)
- **Filtering** — Filter entries by date range, category, and type
- **Responsive UI** — Works on all screen sizes from 320px to 2560px

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | SQLite + Sequelize ORM |
| Authentication | JWT + bcrypt |
| Frontend | React (Vite) |
| Charts | Chart.js + react-chartjs-2 |
| Styling | Tailwind CSS |
| Testing | Jest, Supertest, Vitest, fast-check |

## Project Structure

```
budget-tracker/
├── server/            # Express REST API
│   ├── src/
│   │   ├── config/    # Database, logger, seeders
│   │   ├── middleware/# JWT auth, error handler
│   │   ├── models/    # Sequelize models (User, Category, BudgetEntry)
│   │   ├── routes/    # Express route handlers
│   │   ├── services/  # Business logic layer
│   │   └── utils/     # JWT helpers, AppError class
│   └── tests/         # Integration tests
├── client/            # React SPA
│   ├── src/
│   │   ├── api/       # Axios API client modules
│   │   ├── components/# Reusable UI components
│   │   ├── pages/     # Page-level components
│   │   └── utils/     # Chart data utilities
│   └── tests/
└── presentation/      # HTML slide deck for demo
```

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

No database installation required — SQLite is bundled and the database file is created automatically on first run.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ToebyyBryant/budget-tracker.git
cd budget-tracker
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure environment

Create a `.env` file in the `server/` directory:

```bash
cd ../server
cp .env.example .env
```

Or create `server/.env` manually with:

```env
DATABASE_PATH=./data/budget_tracker.sqlite
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=development
```

### 4. Start the backend

```bash
cd server
node src/index.js
```

You should see:
```
{"level":"info","message":"Database connection established."}
{"level":"info","message":"Database models synchronised."}
{"level":"info","message":"Default categories seeded (if needed)."}
{"level":"info","message":"Server running on port 3001"}
```

The database and tables are created automatically on first start.

### 5. Start the frontend (in a new terminal)

```bash
cd client
npx vite
```

You should see:
```
VITE v5.0.11  ready in ~600ms
➜  Local:   http://localhost:5173/
```

### 6. Open the app

Navigate to **http://localhost:5173** in your browser.

1. Register a new account
2. Start adding income and expense entries
3. View your dashboard with charts and summaries

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, receive JWT |
| POST | /api/auth/logout | Yes | Client-side logout |
| GET | /api/categories | Yes | List categories |
| POST | /api/categories | Yes | Create category |
| DELETE | /api/categories/:id | Yes | Delete category |
| GET | /api/entries | Yes | List entries (with filters) |
| POST | /api/entries | Yes | Create entry |
| PUT | /api/entries/:id | Yes | Update entry |
| DELETE | /api/entries/:id | Yes | Delete entry |
| GET | /api/dashboard/summary | Yes | Income/expense totals |
| GET | /api/dashboard/charts/pie | Yes | Expenses by category |
| GET | /api/dashboard/charts/bar | Yes | Monthly comparison |
| GET | /api/dashboard/charts/line | Yes | Cumulative balance |

## Running Tests

```bash
# Backend tests (requires test database)
cd server
npm test

# Frontend tests
cd client
npm test
```

## License

MIT
