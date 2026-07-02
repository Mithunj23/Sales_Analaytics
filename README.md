# SalesIQ — Sales Analytics Dashboard

🔗 **Live Demo:** [https://salesiq-ivory.vercel.app](https://salesiq-ivory.vercel.app)

A full-stack business intelligence dashboard that analyzes 600+ sales transactions and surfaces actionable insights through 11 interactive pages, statistical analysis, and automated reporting.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router, Axios |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pandas, NumPy |
| Database | PostgreSQL (Supabase) |
| Deployment | Vercel (Frontend) · Render (Backend) · Supabase (Database) |

---

## What's Inside

### 11 Dashboard Pages

| Page | What it shows |
|------|--------------|
| Executive Overview | Revenue, profit, orders, customers, AOV, growth % KPIs |
| Revenue Trends | Monthly revenue & profit with MoM growth rate |
| Regional Performance | Revenue, profit, margin by region — bar + radar charts |
| Customer Segmentation | RFM analysis — Champions, Loyal, At Risk, Lost segments |
| Product Performance | Top products & categories by revenue and profit |
| Discount Impact | Discount vs profit correlation, scatter plot, erosion alerts |
| Pareto 80/20 | Top 20% customers and products driving 80% revenue |
| Trend Detection | Monthly trend classification with 3-month rolling average |
| Anomaly Detection | Z-score outlier detection — spikes and drops flagged |
| AI Insights | Auto-generated executive summary and recommendations |
| Export Reports | Download CSV and JSON reports |

### Analytics Methods

- **RFM Segmentation** — Recency, Frequency, Monetary scoring (quintiles 1–5) to classify 5 customer segments
- **Anomaly Detection** — Z-score (|Z| > 2.5) flags statistical outliers as spikes or drops
- **Pareto Analysis** — Cumulative revenue % to identify the vital 20% of customers and products
- **Trend Detection** — MoM % change classifies each month as increasing / stable / declining with rolling average overlay
- **Discount Correlation** — Pearson r between discount rate and revenue/profit; negative profit correlation triggers a UI warning
- **SQL Analytics** — Window functions (RANK), CTEs for MoM growth, GROUP BY aggregations, COUNT DISTINCT for customer metrics

---

## Project Structure

```
sales-dashboard/
├── backend/
│   ├── main.py                    # FastAPI app entry, auto-seeds DB on startup
│   ├── database/connection.py     # SQLAlchemy engine and session
│   ├── models/sales.py            # Sale ORM model
│   ├── schemas/sales.py           # Pydantic schemas
│   ├── analytics/engine.py        # All analytics — SQL + Pandas pipeline
│   ├── services/data_generator.py # Generates 600 synthetic transactions
│   ├── routes/api.py              # 16 REST API endpoints
│   └── reports/generator.py       # CSV and JSON report generation
│
└── frontend/
    └── src/
        ├── pages/                 # 11 dashboard pages
        ├── components/layout/     # Sidebar + TopBar with CSV upload
        ├── components/ui/         # KPICard, Badge, Table, Skeleton
        ├── services/api.js        # Axios API client
        ├── hooks/useAPI.js        # Data fetching hook
        └── utils/helpers.js       # Formatters and chart colors
```

---

## How It Works

### Startup
```
Server starts
  → SQLAlchemy creates `sales` table if missing
  → If table is empty: generate 600 synthetic rows, bulk INSERT
  → Uvicorn serves API on :8000
  → React app loads on :5173
```

### Page Load
```
User opens any page
  → useAPI() hook fires → loading skeletons shown
  → Axios calls FastAPI endpoint
  → analytics/engine.py runs SQL query or Pandas pipeline
  → JSON returned → React renders charts, tables, KPI cards
```

### CSV Upload
```
User clicks Upload CSV → selects file
  → Backend normalises column names (lowercase, spaces → underscores)
  → Alias mapping: e.g. "amount" → "sales_amount", "client" → "customer_name"
  → Missing columns auto-filled: category → "General", profit → 20% of revenue
  → DELETE FROM sales → bulk INSERT new records in 500-row batches
  → Dashboard reloads with new dataset
```

### Report Export
```
User clicks Download on Reports page
  → Browser hits /api/v1/reports/<type>
  → Backend queries PostgreSQL, formats with Pandas
  → StreamingResponse sends file directly to browser
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/dashboard/summary` | KPI metrics |
| `GET /api/v1/revenue/monthly` | Monthly revenue + growth |
| `GET /api/v1/regional/performance` | By-region stats |
| `GET /api/v1/customers/segmentation` | RFM segments |
| `GET /api/v1/products/performance` | Product rankings |
| `GET /api/v1/discounts/analysis` | Discount impact |
| `GET /api/v1/pareto/analysis` | 80/20 analysis |
| `GET /api/v1/trends/detection` | Trend classification |
| `GET /api/v1/anomalies/detection` | Z-score outliers |
| `GET /api/v1/insights/ai` | Business recommendations |
| `POST /api/v1/dataset/upload` | Upload custom CSV |
| `GET /api/v1/reports/revenue/csv` | Download revenue CSV |
| `GET /api/v1/reports/customers/csv` | Download customer CSV |
| `GET /api/v1/reports/products/csv` | Download product CSV |
| `GET /api/v1/reports/insights/json` | Download insights JSON |

---

## Quick Start (Local)

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE sales_dashboard;"

# 2. Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL in .env
uvicorn main:app --reload --port 8000

# 3. Frontend  (new terminal)
cd frontend && npm install && npm run dev

# 4. Open  http://localhost:5173
```

Or with Docker:
```bash
docker compose up --build
```

---

## CSV Upload — Accepted Column Names

Only 5 columns required. Everything else is auto-filled.

| Required | Accepted aliases |
|----------|-----------------|
| `order_id` | `id`, `invoice_id`, `transaction_id` |
| `customer_name` | `customer`, `client`, `name` |
| `product_name` | `product`, `item`, `description` |
| `sales_amount` | `revenue`, `amount`, `total`, `price` |
| `order_date` | `date`, `sale_date`, `invoice_date` |

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [https://salesiq-ivory.vercel.app](https://salesiq-ivory.vercel.app) |
| Backend API | Render | https://salesiq-backend.onrender.com |
| API Docs | Render | https://salesiq-backend.onrender.com/docs |
| Database | Supabase | Internal (PostgreSQL) |

---

