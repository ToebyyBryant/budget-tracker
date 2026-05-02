# Budget Tracker

A full-stack web application for tracking personal income and expenses. Built with Node.js/Express, PostgreSQL, and React — demonstrating MVC architecture, relational DB design, RESTful API patterns, and modern UI skills.

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
| Database | PostgreSQL + Sequelize ORM |
| Authentication | JWT + bcrypt |
| Frontend | React (Vite) |
| Charts | Chart.js + react-chartjs-2 |
| Styling | Tailwind CSS |
| Testing | Jest, Supertest, Vitest, fast-check |

## Project Structure

```
budget-tracker/
├── server/          # Express REST API
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
└── client/          # React SPA
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   └── utils/
    └── tests/
```

## Getting Started

> Setup instructions will be added as the project is scaffolded.

## License

MIT
