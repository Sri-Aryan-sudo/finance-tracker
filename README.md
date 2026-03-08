# FinTrack — Personal Finance Tracker

A beautiful, full-stack personal finance tracker web application built with React, Node.js, Express, and PostgreSQL.

## ✨ Features

- **Multi-user authentication** — Signup, login with JWT
- **Transaction management** — Add, edit, delete, view transactions
- **Dashboard** — Colorful summary cards + 4 interactive charts
- **Analytics** — Drill-down pie chart (Category → Subcategory → Source)
- **CSV Upload** — Bulk import transactions via CSV
- **CSV Export** — Export filtered transactions
- **Filters & Search** — Type, category, payment method, date range, full-text search
- **Pagination & Sorting** — TanStack Table integration
- **Responsive UI** — Material Design color palette, DM Sans font

## 🏗 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React (class components), TailwindCSS, Recharts, TanStack Table |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | bcrypt + JWT |

## 📁 Project Structure

```
finance-tracker/
├── frontend/          # React app
├── backend/           # Express API
└── database/          # SQL schema
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
# Create database
createdb finance_tracker

# Run schema
psql -U postgres -d finance_tracker -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
npm start
# API runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
# App opens at http://localhost:3000
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, get JWT |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Summary + charts data |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List with filters, pagination, sorting |
| GET | `/api/transactions/:id` | Single transaction |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |

**Query Parameters for GET /api/transactions:**
- `type` — income or expense
- `category` — Food, Travel, Salary, etc.
- `payment_method` — UPI, Card, Cash, etc.
- `date_from`, `date_to` — Date range filter
- `search` — Full-text search
- `page`, `limit` — Pagination
- `sort_by`, `sort_order` — Sorting

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Drill-down analytics data |

### CSV Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload CSV file |
| GET | `/api/upload/template` | Download CSV template |

## 📊 CSV Format

Required columns: `date`, `amount`, `type`, `category`

Optional: `subcategory`, `payment_method`, `source`, `description`

```csv
date,amount,type,category,subcategory,payment_method,source,description
2024-01-15,50000,income,Salary,,Bank Transfer,TechCorp,Monthly salary
2024-01-20,1200,expense,Food,Groceries,UPI,BigBasket,Weekly groceries
```

## 🎨 UI Pages

- **Login / Signup** — Centered card with gradient background
- **Dashboard** — 4 summary cards + 3 charts + recent transactions
- **Transactions** — Full table with filters, search, pagination, edit/delete
- **Transaction Detail** — Full detail view with edit inline
- **Analytics** — Drill-down pie chart + monthly bar chart
- **Upload CSV** — Drag-and-drop file upload with instructions

## 🔐 Environment Variables

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```
