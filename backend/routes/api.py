from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
import io
from database.connection import get_db
from analytics import engine as analytics
from reports import generator as reports

router = APIRouter()


# ── Dataset ───────────────────────────────────────────────────────────────────

@router.get("/dataset/status")
def dataset_status(db: Session = Depends(get_db)):
    count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar()
    return {"count": count, "has_data": count > 0}


@router.post("/dataset/upload")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")
    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))

        # Step 1 — normalise column names: lowercase, strip spaces, replace spaces/dashes with _
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_", regex=False)
            .str.replace("-", "_", regex=False)
        )

        # Step 2 — map common aliases to canonical names
        ALIASES = {
            "order_id":         ["orderid", "id", "order_number", "invoice_id", "transaction_id", "invoice_no", "order_no"],
            "customer_id":      ["customerid", "cust_id", "client_id", "customer_code"],
            "customer_name":    ["customer_name", "customername", "customer", "client_name", "client", "name", "buyer"],
            "product_name":     ["product_name", "productname", "product", "item", "item_name", "description", "product_description", "product_title"],
            "product_category": ["category", "productcategory", "department", "segment", "product_type", "type"],
            "region":           ["area", "territory", "location", "geography", "zone", "state", "country", "market"],
            "sales_amount":     ["sales", "revenue", "amount", "total", "price", "sale_amount", "total_sales", "gross_sales", "net_sales", "sales_value"],
            "quantity":         ["qty", "units", "unit_quantity", "count", "num_units", "quantity_ordered"],
            "discount":         ["discount_rate", "disc", "discount_pct", "disc_rate", "discount_amount", "pct_discount"],
            "profit":           ["net_profit", "margin", "gross_profit", "net", "profit_margin", "net_margin"],
            "order_date":       ["date", "orderdate", "sale_date", "transaction_date", "invoice_date", "purchase_date", "ship_date"],
        }

        for canonical, aliases in ALIASES.items():
            if canonical not in df.columns:
                for alias in aliases:
                    if alias in df.columns:
                        df = df.rename(columns={alias: canonical})
                        break

        # Step 3 — only 5 columns truly required; everything else gets a default
        hard_required = {"order_id", "customer_name", "product_name", "sales_amount", "order_date"}
        missing = hard_required - set(df.columns)
        if missing:
            raise HTTPException(
                400,
                f"Missing required columns: {sorted(missing)}. "
                f"Your columns (after normalisation): {sorted(df.columns.tolist())}. "
                f"Tip — rename your columns to match any of these accepted names: "
                f"order_id={ALIASES['order_id']}, "
                f"customer_name={ALIASES['customer_name']}, "
                f"product_name={ALIASES['product_name']}, "
                f"sales_amount={ALIASES['sales_amount']}, "
                f"order_date={ALIASES['order_date']}."
            )

        # Step 4 — fill missing optional columns with safe defaults
        if "customer_id" not in df.columns:
            df["customer_id"] = "C" + pd.Series(
                pd.factorize(df["customer_name"].astype(str))[0]
            ).astype(str).str.zfill(4).values
        if "product_category" not in df.columns:
            df["product_category"] = "General"
        if "region" not in df.columns:
            df["region"] = "Unknown"
        if "quantity" not in df.columns:
            df["quantity"] = 1
        if "discount" not in df.columns:
            df["discount"] = 0.0
        if "profit" not in df.columns:
            df["profit"] = (pd.to_numeric(df["sales_amount"], errors="coerce").fillna(0) * 0.20).round(2)

        # Step 5 — coerce types
        df["order_date"]   = pd.to_datetime(df["order_date"], dayfirst=False, errors="coerce").dt.date
        df["sales_amount"] = pd.to_numeric(df["sales_amount"], errors="coerce").fillna(0.0)
        df["profit"]       = pd.to_numeric(df["profit"],       errors="coerce").fillna(0.0)
        df["quantity"]     = pd.to_numeric(df["quantity"],     errors="coerce").fillna(1).astype(int)
        df["discount"]     = pd.to_numeric(df["discount"],     errors="coerce").fillna(0.0)

        # Auto-convert percentage discounts (e.g. 15 → 0.15)
        if df["discount"].max() > 1:
            df["discount"] = df["discount"] / 100.0

        # Step 6 — clean rows
        bad_dates = df["order_date"].isna().sum()
        df = df.dropna(subset=["order_date"])
        df = df.drop_duplicates(subset=["order_id"])
        df = df[df["sales_amount"] > 0]

        if len(df) == 0:
            raise HTTPException(400, "No valid rows remain after cleaning. Check dates and sales amounts.")

        # Step 7 — bulk insert
        final_cols = ["order_id", "customer_id", "customer_name", "product_name",
                      "product_category", "region", "sales_amount", "quantity",
                      "discount", "profit", "order_date"]
        records = df[final_cols].to_dict("records")

        db.execute(text("DELETE FROM sales"))
        insert_stmt = text("""
            INSERT INTO sales (order_id, customer_id, customer_name, product_name,
                product_category, region, sales_amount, quantity, discount, profit, order_date)
            VALUES (:order_id, :customer_id, :customer_name, :product_name,
                :product_category, :region, :sales_amount, :quantity, :discount, :profit, :order_date)
            ON CONFLICT (order_id) DO NOTHING
        """)
        for i in range(0, len(records), 500):
            db.execute(insert_stmt, records[i:i + 500])
        db.commit()

        warnings = []
        if bad_dates > 0:
            warnings.append(f"{bad_dates} rows skipped — unparseable dates")

        return {
            "message": f"Successfully uploaded {len(records)} records",
            "rows_uploaded": len(records),
            "warnings": warnings,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Upload failed: {str(e)}")


# ── Analytics endpoints ───────────────────────────────────────────────────────

@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return analytics.get_dashboard_summary(db)

@router.get("/revenue/monthly")
def monthly_revenue(db: Session = Depends(get_db)):
    return analytics.get_monthly_revenue(db)

@router.get("/regional/performance")
def regional_performance(db: Session = Depends(get_db)):
    return analytics.get_regional_performance(db)

@router.get("/customers/segmentation")
def customer_segmentation(db: Session = Depends(get_db)):
    return analytics.get_customer_segmentation(db)

@router.get("/products/performance")
def product_performance(db: Session = Depends(get_db)):
    return analytics.get_product_performance(db)

@router.get("/discounts/analysis")
def discount_analysis(db: Session = Depends(get_db)):
    return analytics.get_discount_analysis(db)

@router.get("/pareto/analysis")
def pareto_analysis(db: Session = Depends(get_db)):
    return analytics.get_pareto_analysis(db)

@router.get("/trends/detection")
def trend_detection(db: Session = Depends(get_db)):
    return analytics.get_trend_detection(db)

@router.get("/anomalies/detection")
def anomaly_detection(db: Session = Depends(get_db)):
    return analytics.get_anomaly_detection(db)

@router.get("/insights/ai")
def ai_insights(db: Session = Depends(get_db)):
    return analytics.get_ai_insights(db)


# ── Report downloads ──────────────────────────────────────────────────────────

@router.get("/reports/revenue/csv")
def revenue_report_csv(db: Session = Depends(get_db)):
    return StreamingResponse(
        io.StringIO(reports.generate_revenue_csv(db)),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=revenue_report.csv"},
    )

@router.get("/reports/customers/csv")
def customer_report_csv(db: Session = Depends(get_db)):
    return StreamingResponse(
        io.StringIO(reports.generate_customer_csv(db)),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customer_report.csv"},
    )

@router.get("/reports/products/csv")
def product_report_csv(db: Session = Depends(get_db)):
    return StreamingResponse(
        io.StringIO(reports.generate_product_csv(db)),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=product_report.csv"},
    )

@router.get("/reports/insights/json")
def insights_report_json(db: Session = Depends(get_db)):
    return JSONResponse(
        content=reports.generate_insights_json(db),
        headers={"Content-Disposition": "attachment; filename=insights_report.json"},
    )