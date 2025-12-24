# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

---

### Groups

#### Create Group

```http
POST /groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Weekend Trip",
  "memberEmails": ["jane@example.com", "bob@example.com"]
}
```

#### Get My Groups

```http
GET /groups
Authorization: Bearer <token>
```

#### Get Group by ID

```http
GET /groups/:groupId
Authorization: Bearer <token>
```

#### Add Members

```http
POST /groups/:groupId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "emails": ["alice@example.com"]
}
```

#### Remove Member

```http
DELETE /groups/:groupId/members/:memberId
Authorization: Bearer <token>
```

---

### Expenses

#### Create Expense - Equal Split

```http
POST /groups/:groupId/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Dinner at restaurant",
  "amount": 120,
  "splitType": "EQUAL"
}
```

_Splits equally among all group members_

#### Create Expense - Exact Split

```http
POST /groups/:groupId/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Groceries",
  "amount": 100,
  "splitType": "EXACT",
  "splits": [
    {"userId": "USER_ID_1", "amount": 60},
    {"userId": "USER_ID_2", "amount": 40}
  ]
}
```

_Amounts must sum to total_

#### Create Expense - Percentage Split

```http
POST /groups/:groupId/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Rent",
  "amount": 1000,
  "splitType": "PERCENTAGE",
  "splits": [
    {"userId": "USER_ID_1", "percentage": 60},
    {"userId": "USER_ID_2", "percentage": 40}
  ]
}
```

_Percentages must sum to 100_

#### Get Group Expenses

```http
GET /groups/:groupId/expenses?page=1&limit=20
Authorization: Bearer <token>
```

---

### Balances

#### Get Group Balances

```http
GET /groups/:groupId/balances
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "youOwe": [
      {"user": {...}, "amount": 50}
    ],
    "owesYou": [
      {"user": {...}, "amount": 30}
    ],
    "totalYouOwe": 50,
    "totalOwesYou": 30
  }
}
```

#### Get My Overall Balances

```http
GET /users/me/balances
Authorization: Bearer <token>
```

#### Settle Debt

```http
POST /groups/:groupId/settle
Authorization: Bearer <token>
Content-Type: application/json

{
  "creditorId": "USER_ID",
  "amount": 50
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not a group member)
- `404` - Not Found
- `500` - Server Error
