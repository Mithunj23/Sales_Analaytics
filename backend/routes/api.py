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
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files supported")
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
        required = {"order_id", "customer_id", "customer_name", "product_name",
                    "product_category", "region", "sales_amount", "quantity",
                    "discount", "profit", "order_date"}
        missing = required - set(df.columns.str.lower())
        if missing:
            raise HTTPException(400, f"Missing columns: {missing}")
        df.columns = df.columns.str.lower()
        df["order_date"] = pd.to_datetime(df["order_date"]).dt.date
        df = df[list(required)]  # keep only expected columns, in case of extras
        db.execute(text("DELETE FROM sales"))
        records = df.to_dict("records")
        insert_stmt = text("""
            INSERT INTO sales (order_id, customer_id, customer_name, product_name,
                product_category, region, sales_amount, quantity, discount, profit, order_date)
            VALUES (:order_id, :customer_id, :customer_name, :product_name,
                :product_category, :region, :sales_amount, :quantity, :discount, :profit, :order_date)
            ON CONFLICT (order_id) DO NOTHING
        """)
        # Bulk insert in batches for performance on large CSVs
        batch_size = 500
        for i in range(0, len(records), batch_size):
            db.execute(insert_stmt, records[i:i + batch_size])
        db.commit()
        return {"message": f"Uploaded {len(df)} records successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


# ── Analytics ─────────────────────────────────────────────────────────────────

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


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports/revenue/csv")
def revenue_report_csv(db: Session = Depends(get_db)):
    csv_data = reports.generate_revenue_csv(db)
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=revenue_report.csv"},
    )


@router.get("/reports/customers/csv")
def customer_report_csv(db: Session = Depends(get_db)):
    csv_data = reports.generate_customer_csv(db)
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customer_report.csv"},
    )


@router.get("/reports/products/csv")
def product_report_csv(db: Session = Depends(get_db)):
    csv_data = reports.generate_product_csv(db)
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=product_report.csv"},
    )


@router.get("/reports/insights/json")
def insights_report_json(db: Session = Depends(get_db)):
    data = reports.generate_insights_json(db)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": "attachment; filename=insights_report.json"},
    )
