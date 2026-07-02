SalesIQ — Sales Analytics Dashboard

A full-stack business intelligence dashboard that analyzes 600+ sales transactions and surfaces actionable insights through 11 interactive pages, statistical analysis, and automated reporting.


Tech Stack

LayerTechnologiesFrontendReact 18, Vite, Tailwind CSS, Recharts, React Router, AxiosBackendPython 3.11, FastAPI, SQLAlchemy, Pandas, NumPyDatabasePostgreSQL 15


What's Inside

11 Dashboard Pages

PageWhat it showsExecutive OverviewRevenue, profit, orders, customers, AOV, growth % KPIsRevenue TrendsMonthly revenue & profit with MoM growth rateRegional PerformanceRevenue, profit, margin by region — bar + radar chartsCustomer SegmentationRFM analysis — Champions, Loyal, At Risk, Lost segmentsProduct PerformanceTop products & categories by revenue and profitDiscount ImpactDiscount vs profit correlation, scatter plot, erosion alertsPareto 80/20Top 20% customers and products driving 80% revenueTrend DetectionMonthly trend classification with 3-month rolling averageAnomaly DetectionZ-score outlier detection — spikes and drops flaggedAI InsightsAuto-generated executive summary and recommendationsExport ReportsDownload CSV and JSON reports

Analytics Methods


RFM Segmentation — Recency, Frequency, Monetary scoring (quintiles 1–5) to classify 5 customer segments
Anomaly Detection — Z-score (|Z| > 2.5) flags statistical outliers as spikes or drops
Pareto Analysis — Cumulative revenue % to identify the vital 20% of customers and products
Trend Detection — MoM % change classifies each month as increasing / stable / declining with rolling average overlay
Discount Correlation — Pearson r between discount rate and revenue/profit; negative profit correlation triggers a UI warning
SQL Analytics — Window functions (RANK), CTEs for MoM growth, GROUP BY aggregations, COUNT DISTINCT for customer metrics



Project Structure

sales-dashboard/
├── backend/
│   ├── main.py                   # FastAPI app entry, auto-seeds DB on startup
│   ├── database/connection.py    # SQLAlchemy engine and session
│   ├── models/sales.py           # Sale ORM model
│   ├── schemas/sales.py          # Pydantic schemas
│   ├── analytics/engine.py       # All analytics — SQL + Pandas pipeline
│   ├── services/data_generator.py # Generates 600 synthetic transactions
│   ├── routes/api.py             # 16 REST API endpoints
│   └── reports/generator.py      # CSV and JSON report generation
│
└── frontend/
    └── src/
        ├── pages/                # 11 dashboard pages
        ├── components/layout/    # Sidebar + TopBar with CSV upload
        ├── components/ui/        # KPICard, Badge, Table, Skeleton
        ├── services/api.js       # Axios API client
        ├── hooks/useAPI.js       # Data fetching hook
        └── utils/helpers.js      # Formatters and chart colors


How It Works

Startup

Server starts
  → SQLAlchemy creates `sales` table if missing
  → If table is empty: generate 600 synthetic rows, bulk INSERT
  → Uvicorn serves API on :8000
  → React app loads on :5173

Page Load

User opens any page
  → useAPI() hook fires → loading skeletons shown
  → Axios calls FastAPI endpoint
  → analytics/engine.py runs SQL query or Pandas pipeline
  → JSON returned → React renders charts, tables, KPI cards

CSV Upload

User clicks Upload CSV → selects file
  → Backend normalises column names (lowercase, spaces → underscores)
  → Alias mapping: e.g. "amount" → "sales_amount", "client" → "customer_name"
  → Missing columns auto-filled: category → "General", profit → 20% of revenue
  → DELETE FROM sales → bulk INSERT new records in 500-row batches
  → Dashboard reloads with new dataset

Report Export

User clicks Download on Reports page
  → Browser hits /api/v1/reports/<type>
  → Backend queries PostgreSQL, formats with Pandas
  → StreamingResponse sends file directly to browser


API Endpoints

EndpointDescriptionGET /api/v1/dashboard/summaryKPI metricsGET /api/v1/revenue/monthlyMonthly revenue + growthGET /api/v1/regional/performanceBy-region statsGET /api/v1/customers/segmentationRFM segmentsGET /api/v1/products/performanceProduct rankingsGET /api/v1/discounts/analysisDiscount impactGET /api/v1/pareto/analysis80/20 analysisGET /api/v1/trends/detectionTrend classificationGET /api/v1/anomalies/detectionZ-score outliersGET /api/v1/insights/aiBusiness recommendationsPOST /api/v1/dataset/uploadUpload custom CSVGET /api/v1/reports/revenue/csvDownload revenue CSVGET /api/v1/reports/customers/csvDownload customer CSVGET /api/v1/reports/products/csvDownload product CSVGET /api/v1/reports/insights/jsonDownload insights JSON


Quick Start

bash# 1. Create database
psql -U postgres -c "CREATE DATABASE sales_dashboard;"

# 2. Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL in .env
uvicorn main:app --reload --port 8000

# 3. Frontend  (new terminal)
cd frontend && npm install && npm run dev

# 4. Open  http://localhost:5173

Or with Docker:

bashdocker compose up --build


CSV Upload — Accepted Column Names

Only 5 columns required. Everything else is auto-filled.

RequiredAccepted aliasesorder_idid, invoice_id, transaction_idcustomer_namecustomer, client, nameproduct_nameproduct, item, descriptionsales_amountrevenue, amount, total, priceorder_datedate, sale_date, invoice_date