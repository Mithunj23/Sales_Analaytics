import pandas as pd
import json
import io
from sqlalchemy.orm import Session
from sqlalchemy import text
from analytics.engine import (
    get_dashboard_summary, get_monthly_revenue, get_regional_performance,
    get_product_performance, get_customer_segmentation
)


def generate_revenue_csv(db: Session) -> str:
    rows = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') AS month,
            region,
            product_category,
            SUM(sales_amount)  AS revenue,
            SUM(profit)        AS profit,
            COUNT(id)          AS orders,
            AVG(discount)      AS avg_discount
        FROM sales
        GROUP BY DATE_TRUNC('month', order_date), region, product_category
        ORDER BY DATE_TRUNC('month', order_date), revenue DESC
    """)).fetchall()

    df = pd.DataFrame(rows, columns=["Month", "Region", "Category", "Revenue", "Profit", "Orders", "Avg Discount"])
    df["Revenue"] = df["Revenue"].round(2)
    df["Profit"] = df["Profit"].round(2)
    df["Avg Discount"] = (df["Avg Discount"] * 100).round(1).astype(str) + "%"

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


def generate_customer_csv(db: Session) -> str:
    rows = db.execute(text("""
        WITH customer_stats AS (
            SELECT
                customer_id,
                customer_name,
                COUNT(DISTINCT order_id)     AS total_orders,
                SUM(sales_amount)            AS total_revenue,
                SUM(profit)                  AS total_profit,
                AVG(sales_amount)            AS avg_order_value,
                MIN(order_date)              AS first_order,
                MAX(order_date)              AS last_order,
                SUM(quantity)                AS total_items,
                RANK() OVER (ORDER BY SUM(sales_amount) DESC) AS revenue_rank
            FROM sales
            GROUP BY customer_id, customer_name
        )
        SELECT * FROM customer_stats ORDER BY revenue_rank
    """)).fetchall()

    df = pd.DataFrame(rows, columns=[
        "Customer ID", "Customer Name", "Total Orders", "Total Revenue",
        "Total Profit", "Avg Order Value", "First Order", "Last Order",
        "Total Items", "Revenue Rank"
    ])
    df["Total Revenue"] = df["Total Revenue"].astype(float).round(2)
    df["Total Profit"] = df["Total Profit"].astype(float).round(2)
    df["Avg Order Value"] = df["Avg Order Value"].astype(float).round(2)

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


def generate_product_csv(db: Session) -> str:
    rows = db.execute(text("""
        SELECT
            product_name,
            product_category,
            SUM(quantity)        AS total_qty,
            COUNT(id)            AS total_orders,
            SUM(sales_amount)    AS total_revenue,
            SUM(profit)          AS total_profit,
            AVG(discount)        AS avg_discount,
            AVG(sales_amount)    AS avg_sale,
            RANK() OVER (ORDER BY SUM(sales_amount) DESC) AS rank
        FROM sales
        GROUP BY product_name, product_category
        ORDER BY total_revenue DESC
    """)).fetchall()

    df = pd.DataFrame(rows, columns=[
        "Product", "Category", "Total Qty", "Total Orders",
        "Total Revenue", "Total Profit", "Avg Discount", "Avg Sale", "Rank"
    ])
    df["Total Revenue"] = df["Total Revenue"].astype(float).round(2)
    df["Total Profit"] = df["Total Profit"].astype(float).round(2)
    df["Avg Discount"] = (df["Avg Discount"].astype(float) * 100).round(1).astype(str) + "%"
    df["Avg Sale"] = df["Avg Sale"].astype(float).round(2)

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


def generate_insights_json(db: Session) -> dict:
    summary = get_dashboard_summary(db)
    monthly = get_monthly_revenue(db)
    regional = get_regional_performance(db)
    products = get_product_performance(db)
    segmentation = get_customer_segmentation(db)

    return {
        "generated_at": pd.Timestamp.now().isoformat(),
        "executive_summary": summary,
        "monthly_performance": monthly,
        "regional_analysis": regional,
        "product_analysis": {
            "top_10_products": products["products"][:10],
            "category_breakdown": products["categories"],
        },
        "customer_segments": segmentation["segments"],
    }
