# SalesIQ — Full-Stack Sales Analytics Dashboard

> A production-grade, recruiter-ready analytics dashboard analyzing 500+ transactions with interactive visualizations, statistical analysis, and automated reporting.

![Tech Stack](https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/React-Vite-646CFF?style=flat-square&logo=vite)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)
![Tech Stack](https://img.shields.io/badge/Pandas-Analytics-150458?style=flat-square&logo=pandas)

---

## Resume Statement

> *"Built an end-to-end Sales Analytics Dashboard using Python, SQL, Pandas, Statistical Analysis, and Data Visualization, analyzing 500+ transactions to uncover monthly revenue trends, regional performance, customer segmentation (RFM), discount impact, Pareto analysis, trend detection, and anomaly identification while generating automated CSV and JSON business insight reports."*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pandas, NumPy |
| Database | PostgreSQL 15+ |
| Analytics | Pandas, NumPy, SciPy, Statistical Z-score analysis |
| Reporting | CSV export, JSON export, automated report generation |

---

## Features

### Analytics Modules

| Module | Description |
|--------|-------------|
| 📊 Executive Dashboard | KPI cards: Revenue, Orders, Customers, Profit, AOV, Growth |
| 📈 Revenue Trends | Monthly aggregation, MoM growth, area charts |
| 🗺️ Regional Performance | Heatmaps, radar chart, regional comparison |
| 👥 Customer Segmentation | RFM Analysis (Champions → Lost Customers) |
| 📦 Product Performance | Revenue/profit ranking, category pie charts |
| 🏷️ Discount Impact | Correlation analysis, scatter plots, profit erosion detection |
| 📐 Pareto Analysis | 80/20 rule for customers and products |
| 📉 Trend Detection | Seasonal patterns, rolling average, MoM classification |
| ⚠️ Anomaly Detection | Z-score outlier detection (spikes & drops) |
| 🧠 AI Insights | Executive summary, strategic recommendations |
| 📥 Report Export | CSV (revenue/customer/product) + JSON insights |
| 📤 CSV Upload | Custom dataset ingestion |

### SQL Analytics

- Window functions (RANK, running totals)
- CTEs for multi-step aggregations
- GROUP BY with monthly/regional/product dimensions
- JOINs for customer-sales analysis
- Aggregates: SUM, AVG, COUNT, MAX, MIN

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### 1. Database Setup

```bash
psql -U postgres
CREATE DATABASE sales_dashboard;
\q
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string

# Start the API server
uvicorn main:app --reload --port 8000
```

The server auto-seeds 600 realistic synthetic sales records on first launch.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Documentation

Interactive docs available at **http://localhost:8000/docs**

### Endpoints

```
GET  /api/v1/dashboard/summary      → KPI metrics
GET  /api/v1/revenue/monthly        → Monthly revenue data
GET  /api/v1/regional/performance   → By-region analytics
GET  /api/v1/customers/segmentation → RFM segments + scores
GET  /api/v1/products/performance   → Product rankings
GET  /api/v1/discounts/analysis     → Discount impact analysis
GET  /api/v1/pareto/analysis        → 80/20 customer & product
GET  /api/v1/trends/detection       → Trend classification
GET  /api/v1/anomalies/detection    → Z-score outliers
GET  /api/v1/insights/ai            → Business recommendations
GET  /api/v1/reports/revenue/csv    → Download revenue CSV
GET  /api/v1/reports/customers/csv  → Download customer CSV
GET  /api/v1/reports/products/csv   → Download product CSV
GET  /api/v1/reports/insights/json  → Download insights JSON
POST /api/v1/dataset/upload         → Upload custom CSV
```

---

## Project Structure

```
sales-dashboard/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── database/
│   │   └── connection.py          # SQLAlchemy engine & session
│   ├── models/
│   │   └── sales.py               # ORM model
│   ├── schemas/
│   │   └── sales.py               # Pydantic request/response schemas
│   ├── analytics/
│   │   └── engine.py              # All analytics (Pandas + SQL)
│   ├── services/
│   │   └── data_generator.py      # Synthetic data generation
│   ├── routes/
│   │   └── api.py                 # All REST API routes
│   └── reports/
│       └── generator.py           # CSV/JSON report generation
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx               # React entry point
        ├── App.jsx                # Router
        ├── index.css              # Global styles
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx    # Collapsible sidebar nav
        │   │   └── TopBar.jsx     # Header with upload
        │   └── ui/
        │       └── index.jsx      # KPICard, Table, Badge, Skeleton
        ├── pages/
        │   ├── Overview.jsx       # Executive dashboard
        │   ├── Revenue.jsx        # Monthly trends
        │   ├── Regional.jsx       # Geographic analysis
        │   ├── Customers.jsx      # RFM segmentation
        │   ├── Products.jsx       # Product performance
        │   ├── Discounts.jsx      # Discount impact
        │   ├── Pareto.jsx         # 80/20 analysis
        │   ├── Trends.jsx         # Trend detection
        │   ├── Anomalies.jsx      # Anomaly detection
        │   ├── Insights.jsx       # AI recommendations
        │   └── Reports.jsx        # Export center
        ├── services/
        │   └── api.js             # Axios API client
        ├── hooks/
        │   └── useAPI.js          # Data fetching hook
        └── utils/
            └── helpers.js         # Formatters, colors, utilities
```

---

## Environment Variables

```env
# backend/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sales_dashboard
SECRET_KEY=change-this-in-production
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173

# Optional: for LLM-powered AI insights
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## Production Deployment

### Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment

**Backend (FastAPI)**
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Frontend (React)**
```bash
cd frontend
npm run build
# Serve dist/ with nginx or any static host
```

---

## Data Schema

Each sales record contains:

| Field | Type | Description |
|-------|------|-------------|
| order_id | VARCHAR | Unique order identifier (ORD-XXXXXX) |
| customer_id | VARCHAR | Customer reference (C001–C040) |
| customer_name | VARCHAR | Full name |
| product_name | VARCHAR | Product name |
| product_category | VARCHAR | Electronics / Furniture / Software / Office Supplies |
| region | VARCHAR | North / South / East / West / Central |
| sales_amount | FLOAT | Transaction revenue |
| quantity | INTEGER | Units ordered |
| discount | FLOAT | Discount rate (0.0–0.30) |
| profit | FLOAT | Net profit |
| order_date | DATE | Transaction date (2023–2024) |

---

## Analytics Methods

| Analysis | Method |
|----------|--------|
| RFM Segmentation | Quintile scoring (1–5 per dimension) |
| Anomaly Detection | Z-score (|z| > 2.5 = outlier) |
| Trend Classification | MoM % change (>10% = increasing, <-10% = declining) |
| Pareto Analysis | Cumulative revenue % with 20th percentile threshold |
| Discount Correlation | Pearson correlation coefficient |
| Moving Average | 3-month rolling window |

---

## License

MIT — Free for personal and commercial use.
