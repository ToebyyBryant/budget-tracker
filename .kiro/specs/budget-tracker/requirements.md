# Requirements Document

## Introduction

A full-stack Budget Tracker web application that allows users to manage personal finances by tracking income and expenses across categories. The application provides CRUD operations for budget entries, data visualizations via charts, and secure user authentication. It demonstrates solid DB design, MVC architecture, and modern UI skills.

## Glossary

- **System**: The Budget Tracker web application as a whole
- **User**: An authenticated person using the application
- **Budget_Entry**: A single financial record with an amount, category, type (income or expense), date, and optional description
- **Category**: A named label used to group Budget_Entries (e.g., Food, Rent, Salary)
- **Auth_Service**: The component responsible for user registration, login, and session management
- **Budget_Service**: The component responsible for creating, reading, updating, and deleting Budget_Entries
- **Category_Service**: The component responsible for managing Categories
- **Chart_Service**: The component responsible for generating data visualizations from Budget_Entries
- **API**: The RESTful HTTP interface between the frontend and backend
- **JWT**: JSON Web Token used for stateless authentication
- **Dashboard**: The main view showing summary statistics and charts for the authenticated User

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to register an account, so that I can securely store and access my personal budget data.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide a registration endpoint that accepts a unique email address and a password of at least 8 characters.
2. WHEN a registration request is received with a valid email and password, THE Auth_Service SHALL create a new User account and return a JWT.
3. IF a registration request is received with an email that already exists, THEN THE Auth_Service SHALL return a 409 Conflict error with a descriptive message.
4. IF a registration request is received with a password shorter than 8 characters, THEN THE Auth_Service SHALL return a 400 Bad Request error with a descriptive message.
5. THE Auth_Service SHALL store passwords as cryptographic hashes and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login and Logout

**User Story:** As a registered user, I want to log in and log out, so that my budget data remains private and accessible only to me.

#### Acceptance Criteria

1. WHEN a login request is received with a valid email and correct password, THE Auth_Service SHALL return a signed JWT with an expiry of 24 hours.
2. IF a login request is received with an unrecognised email or incorrect password, THEN THE Auth_Service SHALL return a 401 Unauthorized error.
3. WHILE a User holds a valid JWT, THE System SHALL grant access to all protected API endpoints.
4. WHEN a User logs out, THE System SHALL invalidate the JWT on the client side and redirect the User to the login page.
5. WHEN a JWT has expired, THE System SHALL return a 401 Unauthorized response and redirect the User to the login page.

---

### Requirement 3: Category Management

**User Story:** As a user, I want to create and manage categories, so that I can organise my budget entries in a way that reflects my spending habits.

#### Acceptance Criteria

1. THE Category_Service SHALL provide default categories including at minimum: Food, Transport, Housing, Entertainment, Healthcare, Salary, and Other.
2. WHEN a User submits a valid category name, THE Category_Service SHALL create a new Category associated with that User.
3. IF a User submits a category name that already exists for that User, THEN THE Category_Service SHALL return a 409 Conflict error.
4. WHEN a User requests to delete a Category that has no associated Budget_Entries, THE Category_Service SHALL delete the Category.
5. IF a User requests to delete a Category that has associated Budget_Entries, THEN THE Category_Service SHALL return a 409 Conflict error with a message indicating the Category is in use.
6. THE Category_Service SHALL return only the Categories belonging to the authenticated User.

---

### Requirement 4: Budget Entry Creation

**User Story:** As a user, I want to add income and expense entries, so that I can record all my financial transactions.

#### Acceptance Criteria

1. WHEN a User submits a Budget_Entry with a valid amount, type (income or expense), category, and date, THE Budget_Service SHALL persist the entry and return the created record with a unique identifier.
2. IF a User submits a Budget_Entry with a missing required field, THEN THE Budget_Service SHALL return a 400 Bad Request error listing the missing fields.
3. IF a User submits a Budget_Entry with an amount less than or equal to zero, THEN THE Budget_Service SHALL return a 400 Bad Request error.
4. THE Budget_Service SHALL associate each Budget_Entry with the authenticated User and SHALL NOT allow a User to create entries for another User.

---

### Requirement 5: Budget Entry Retrieval and Filtering

**User Story:** As a user, I want to view and filter my budget entries, so that I can review my financial history.

#### Acceptance Criteria

1. WHEN a User requests their Budget_Entries, THE Budget_Service SHALL return all entries belonging to that User ordered by date descending.
2. WHEN a User requests Budget_Entries filtered by a date range, THE Budget_Service SHALL return only entries whose date falls within the specified start and end dates (inclusive).
3. WHEN a User requests Budget_Entries filtered by Category, THE Budget_Service SHALL return only entries matching the specified Category.
4. WHEN a User requests Budget_Entries filtered by type, THE Budget_Service SHALL return only entries matching the specified type (income or expense).
5. THE Budget_Service SHALL support combining multiple filters in a single request.
6. THE Budget_Service SHALL return only Budget_Entries belonging to the authenticated User.

---

### Requirement 6: Budget Entry Update and Delete

**User Story:** As a user, I want to edit and delete my budget entries, so that I can correct mistakes and keep my records accurate.

#### Acceptance Criteria

1. WHEN a User submits an update for an existing Budget_Entry with valid fields, THE Budget_Service SHALL persist the changes and return the updated record.
2. IF a User submits an update for a Budget_Entry that does not belong to that User, THEN THE Budget_Service SHALL return a 403 Forbidden error.
3. IF a User submits an update for a Budget_Entry that does not exist, THEN THE Budget_Service SHALL return a 404 Not Found error.
4. WHEN a User requests deletion of a Budget_Entry that belongs to that User, THE Budget_Service SHALL delete the entry and return a 204 No Content response.
5. IF a User requests deletion of a Budget_Entry that does not belong to that User, THEN THE Budget_Service SHALL return a 403 Forbidden error.

---

### Requirement 7: Dashboard Summary

**User Story:** As a user, I want to see a summary of my finances on a dashboard, so that I can quickly understand my current financial position.

#### Acceptance Criteria

1. WHEN a User loads the Dashboard, THE System SHALL display the total income, total expenses, and net balance for the current calendar month.
2. WHEN a User selects a different time period on the Dashboard, THE System SHALL recalculate and display the totals for the selected period within 500ms.
3. THE Dashboard SHALL display the top 5 expense categories by total amount for the selected period.
4. WHEN a User has no Budget_Entries for the selected period, THE Dashboard SHALL display zero values and a prompt to add entries.

---

### Requirement 8: Data Visualizations

**User Story:** As a user, I want to see charts of my spending and income, so that I can identify patterns and make informed financial decisions.

#### Acceptance Criteria

1. THE Chart_Service SHALL render a pie chart showing the breakdown of expenses by Category for the selected period.
2. THE Chart_Service SHALL render a bar chart showing total income versus total expenses grouped by month for the last 6 months.
3. THE Chart_Service SHALL render a line chart showing the cumulative net balance over time for the selected period.
4. WHEN the underlying Budget_Entries change, THE Chart_Service SHALL update all charts on the Dashboard without requiring a full page reload.
5. WHEN a chart dataset is empty, THE Chart_Service SHALL display a placeholder message instead of an empty chart.

---

### Requirement 9: Responsive UI

**User Story:** As a user, I want to access the application on any device, so that I can manage my budget from a desktop or mobile browser.

#### Acceptance Criteria

1. THE System SHALL render all pages correctly on viewport widths from 320px to 2560px.
2. THE System SHALL display a navigation menu accessible on both desktop and mobile viewports.
3. WHEN the viewport width is less than 768px, THE System SHALL collapse the navigation into a hamburger menu.

---

### Requirement 10: Data Integrity and Security

**User Story:** As a user, I want my financial data to be secure and consistent, so that I can trust the application with sensitive information.

#### Acceptance Criteria

1. THE API SHALL enforce authentication on all endpoints except user registration and login.
2. THE System SHALL transmit all data over HTTPS.
3. THE API SHALL validate and sanitise all user-supplied input before persisting it to the database.
4. THE System SHALL enforce that a User can only read, modify, or delete Budget_Entries and Categories that belong to that User.
