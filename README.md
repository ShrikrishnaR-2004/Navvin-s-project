# Splitwise-like Expense Sharing Backend

A production-ready RESTful API for expense sharing built with Node.js, Express, and MongoDB.

## Features

- 🔐 JWT Authentication
- 👥 Group Management
- 💰 Expense Tracking with 3 Split Types (Equal, Exact, Percentage)
- ⚖️ Real-time Balance Calculation
- 💸 Debt Settlement
- 🔄 Atomic Balance Updates with MongoDB Transactions
- 📊 Denormalized Balances for O(1) Queries

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: helmet, cors, bcryptjs

## Prerequisites

- Node.js >= 18
- Docker & Docker Compose (for MongoDB replica set)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MongoDB Replica Set

MongoDB transactions require a replica set. Use Docker Compose:

```bash
docker-compose up -d
```

Wait ~30 seconds for the replica set to initialize.

### 3. Configure Environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Groups

- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add members
- `DELETE /api/groups/:id/members/:userId` - Remove member

### Expenses

- `POST /api/groups/:groupId/expenses` - Create expense
- `GET /api/groups/:groupId/expenses` - List group expenses

### Balances

- `GET /api/groups/:groupId/balances` - Group balance summary
- `POST /api/groups/:groupId/settle` - Settle debt
- `GET /api/users/me/balances` - User's overall balance

## Project Structure

```
src/
├── config/          # Configuration files
├── models/          # Mongoose schemas
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Custom middleware
└── utils/           # Helper functions
```

## Design Decisions

| Decision                  | Rationale                                          |
| ------------------------- | -------------------------------------------------- |
| **Denormalized Balances** | O(1) balance queries vs O(n) expense recalculation |
| **MongoDB Transactions**  | ACID compliance for financial data integrity       |
| **Compound Indexes**      | Fast lookups for [groupId, debtorId, creditorId]   |
| **Split Polymorphism**    | Dynamic splits array handles all 3 types elegantly |
| **JWT over Sessions**     | Stateless auth for horizontal scaling              |

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

## Development

```bash
# Start dev server with auto-reload
npm run dev

# Start production server
npm start
```

## License

MIT
