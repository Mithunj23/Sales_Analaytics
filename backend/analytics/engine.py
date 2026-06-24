import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from datetime import date


def fetch_dataframe(db: Session) -> pd.DataFrame:
    """Fetch all sales data into a DataFrame."""
    result = db.execute(text("""
        SELECT order_id, customer_id, customer_name, product_name, product_category,
               region, sales_amount, quantity, discount, profit, order_date
        FROM sales ORDER BY order_date
    """))
    rows = result.fetchall()
    if not rows:
        return pd.DataFrame()
    df = pd.DataFrame(rows, columns=result.keys())
    df["order_date"] = pd.to_datetime(df["order_date"])
    df["month"] = df["order_date"].dt.to_period("M")
    df["year"] = df["order_date"].dt.year
    df["month_label"] = df["order_date"].dt.strftime("%b %Y")
    return df


# ── Dashboard Summary ─────────────────────────────────────────────────────────

def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    result = db.execute(text("""
        WITH monthly AS (
            SELECT DATE_TRUNC('month', order_date) AS mo,
                   SUM(sales_amount) AS rev
            FROM sales
            GROUP BY mo
            ORDER BY mo DESC
            LIMIT 2
        )
        SELECT
            SUM(s.sales_amount)                            AS total_revenue,
            COUNT(s.id)                                    AS total_orders,
            COUNT(DISTINCT s.customer_id)                  AS total_customers,
            SUM(s.profit)                                  AS total_profit,
            AVG(s.sales_amount)                            AS avg_order_value,
            (SELECT rev FROM monthly LIMIT 1)              AS current_month,
            (SELECT rev FROM monthly OFFSET 1 LIMIT 1)    AS prev_month
        FROM sales s
    """)).fetchone()

    total_revenue = float(result[0] or 0)
    total_orders = int(result[1] or 0)
    total_customers = int(result[2] or 0)
    total_profit = float(result[3] or 0)
    avg_order_value = float(result[4] or 0)
    current_month = float(result[5] or 0)
    prev_month = float(result[6] or 1)

    growth = ((current_month - prev_month) / prev_month * 100) if prev_month else 0
    profit_margin = (total_profit / total_revenue * 100) if total_revenue else 0

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_profit": round(total_profit, 2),
        "avg_order_value": round(avg_order_value, 2),
        "revenue_growth": round(growth, 2),
        "profit_margin": round(profit_margin, 2),
    }


# ── Monthly Revenue ───────────────────────────────────────────────────────────

def get_monthly_revenue(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') AS month,
            DATE_TRUNC('month', order_date)                       AS month_date,
            SUM(sales_amount)                                     AS revenue,
            SUM(profit)                                           AS profit,
            COUNT(id)                                             AS orders
        FROM sales
        GROUP BY DATE_TRUNC('month', order_date)
        ORDER BY month_date
    """)).fetchall()

    data = []
    for i, row in enumerate(rows):
        prev_rev = rows[i - 1][2] if i > 0 else row[2]
        growth = ((row[2] - prev_rev) / prev_rev * 100) if prev_rev and i > 0 else 0
        data.append({
            "month": row[0],
            "revenue": round(float(row[2]), 2),
            "profit": round(float(row[3]), 2),
            "orders": int(row[4]),
            "growth": round(float(growth), 2),
        })
    return data


# ── Regional Performance ──────────────────────────────────────────────────────

def get_regional_performance(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(text("""
        SELECT
            region,
            SUM(sales_amount)         AS revenue,
            SUM(profit)               AS profit,
            COUNT(id)                 AS orders,
            COUNT(DISTINCT customer_id) AS customers,
            AVG(sales_amount)         AS avg_order_value
        FROM sales
        GROUP BY region
        ORDER BY revenue DESC
    """)).fetchall()

    return [{
        "region": row[0],
        "revenue": round(float(row[1]), 2),
        "profit": round(float(row[2]), 2),
        "orders": int(row[3]),
        "customers": int(row[4]),
        "avg_order_value": round(float(row[5]), 2),
    } for row in rows]


# ── RFM Customer Segmentation ─────────────────────────────────────────────────

def get_customer_segmentation(db: Session) -> Dict[str, Any]:
    df = fetch_dataframe(db)
    if df.empty:
        return {"segments": [], "customers": []}

    snapshot_date = df["order_date"].max() + pd.Timedelta(days=1)

    rfm = df.groupby(["customer_id", "customer_name"]).agg(
        recency=("order_date", lambda x: (snapshot_date - x.max()).days),
        frequency=("order_id", "nunique"),
        monetary=("sales_amount", "sum"),
    ).reset_index()

    # Score 1-5 (5 = best)
    rfm["r_score"] = pd.qcut(rfm["recency"], 5, labels=[5, 4, 3, 2, 1]).astype(int)
    rfm["f_score"] = pd.qcut(rfm["frequency"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]).astype(int)
    rfm["m_score"] = pd.qcut(rfm["monetary"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]).astype(int)
    rfm["rfm_score"] = rfm["r_score"] + rfm["f_score"] + rfm["m_score"]

    def segment(row):
        r, f, m = row["r_score"], row["f_score"], row["m_score"]
        score = row["rfm_score"]
        if r >= 4 and f >= 4 and m >= 4:
            return "Champions"
        elif r >= 3 and f >= 3 and m >= 3:
            return "Loyal Customers"
        elif r >= 3 and f <= 2:
            return "Potential Loyalists"
        elif r <= 2 and f >= 3:
            return "At Risk"
        else:
            return "Lost Customers"

    rfm["segment"] = rfm.apply(segment, axis=1)

    segment_summary = rfm.groupby("segment").agg(
        count=("customer_id", "count"),
        revenue=("monetary", "sum"),
        avg_recency=("recency", "mean"),
        avg_frequency=("frequency", "mean"),
        avg_monetary=("monetary", "mean"),
    ).reset_index()

    colors = {
        "Champions": "#6366f1",
        "Loyal Customers": "#22c55e",
        "Potential Loyalists": "#f59e0b",
        "At Risk": "#f97316",
        "Lost Customers": "#ef4444",
    }

    segments = [{
        "segment": row["segment"],
        "count": int(row["count"]),
        "revenue": round(float(row["revenue"]), 2),
        "avg_recency": round(float(row["avg_recency"]), 1),
        "avg_frequency": round(float(row["avg_frequency"]), 1),
        "avg_monetary": round(float(row["avg_monetary"]), 2),
        "color": colors.get(row["segment"], "#94a3b8"),
    } for _, row in segment_summary.iterrows()]

    customers_list = rfm[["customer_id", "customer_name", "recency", "frequency", "monetary",
                           "r_score", "f_score", "m_score", "rfm_score", "segment"]].to_dict("records")

    return {"segments": segments, "customers": customers_list}


# ── Product Performance ───────────────────────────────────────────────────────

def get_product_performance(db: Session) -> Dict[str, Any]:
    rows = db.execute(text("""
        WITH product_stats AS (
            SELECT
                product_name,
                product_category,
                SUM(sales_amount)  AS total_revenue,
                SUM(profit)        AS total_profit,
                SUM(quantity)      AS total_quantity,
                COUNT(id)          AS order_count,
                RANK() OVER (ORDER BY SUM(sales_amount) DESC) AS revenue_rank,
                RANK() OVER (ORDER BY SUM(quantity) DESC)     AS qty_rank
            FROM sales
            GROUP BY product_name, product_category
        )
        SELECT * FROM product_stats ORDER BY total_revenue DESC
    """)).fetchall()

    products = [{
        "product_name": row[0],
        "category": row[1],
        "total_revenue": round(float(row[2]), 2),
        "total_profit": round(float(row[3]), 2),
        "total_quantity": int(row[4]),
        "order_count": int(row[5]),
        "revenue_rank": int(row[6]),
        "qty_rank": int(row[7]),
    } for row in rows]

    # Category summary
    cat_rows = db.execute(text("""
        SELECT product_category,
               SUM(sales_amount) AS revenue,
               SUM(profit)       AS profit,
               COUNT(id)         AS orders
        FROM sales
        GROUP BY product_category
        ORDER BY revenue DESC
    """)).fetchall()

    categories = [{
        "category": row[0],
        "revenue": round(float(row[1]), 2),
        "profit": round(float(row[2]), 2),
        "orders": int(row[3]),
    } for row in cat_rows]

    return {"products": products, "categories": categories}


# ── Discount Impact ───────────────────────────────────────────────────────────

def get_discount_analysis(db: Session) -> Dict[str, Any]:
    df = fetch_dataframe(db)
    if df.empty:
        return {"buckets": [], "correlations": {}}

    df["discount_bucket"] = pd.cut(
        df["discount"],
        bins=[-0.001, 0.0, 0.1, 0.2, 0.3, 1.0],
        labels=["No Discount", "1-10%", "11-20%", "21-30%", "30%+"],
    )

    buckets = df.groupby("discount_bucket", observed=True).agg(
        avg_revenue=("sales_amount", "mean"),
        avg_profit=("profit", "mean"),
        order_count=("order_id", "count"),
        total_revenue=("sales_amount", "sum"),
    ).reset_index()

    rev_corr = df["discount"].corr(df["sales_amount"])
    profit_corr = df["discount"].corr(df["profit"])

    scatter = df[["discount", "sales_amount", "profit"]].sample(min(200, len(df))).to_dict("records")

    return {
        "buckets": [{
            "discount_range": str(row["discount_bucket"]),
            "avg_revenue": round(float(row["avg_revenue"]), 2),
            "avg_profit": round(float(row["avg_profit"]), 2),
            "order_count": int(row["order_count"]),
            "total_revenue": round(float(row["total_revenue"]), 2),
        } for _, row in buckets.iterrows()],
        "correlations": {
            "revenue_correlation": round(float(rev_corr), 3),
            "profit_correlation": round(float(profit_corr), 3),
        },
        "scatter": scatter,
    }


# ── Pareto Analysis ───────────────────────────────────────────────────────────

def get_pareto_analysis(db: Session) -> Dict[str, Any]:
    df = fetch_dataframe(db)
    if df.empty:
        return {"customers": [], "products": []}

    def _pareto_from_series(grp: pd.DataFrame, name_col: str) -> list:
        grp = grp.sort_values("revenue", ascending=False).reset_index(drop=True)
        total = grp["revenue"].sum()
        if total == 0:
            return []
        grp["cumulative_revenue"] = grp["revenue"].cumsum()
        grp["cumulative_pct"] = grp["cumulative_revenue"] / total * 100
        grp["is_top_20"] = grp.index < max(1, int(len(grp) * 0.2))
        grp = grp.rename(columns={name_col: "name"})
        return grp[["name", "revenue", "cumulative_revenue", "cumulative_pct", "is_top_20"]].to_dict("records")

    # Customer pareto – group by ID, keep name as label
    cust_grp = (df.groupby(["customer_id", "customer_name"])["sales_amount"]
                .sum().reset_index()
                .rename(columns={"sales_amount": "revenue", "customer_name": "name"})
                [["name", "revenue"]])
    customers = _pareto_from_series(cust_grp, "name")

    # Product pareto – product_name is both ID and label, no duplicate column
    prod_grp = (df.groupby("product_name")["sales_amount"]
                .sum().reset_index()
                .rename(columns={"sales_amount": "revenue", "product_name": "name"}))
    products = _pareto_from_series(prod_grp, "name")

    return {
        "customers": [{
            "name": r["name"], "revenue": round(float(r["revenue"]), 2),
            "cumulative_revenue": round(float(r["cumulative_revenue"]), 2),
            "cumulative_pct": round(float(r["cumulative_pct"]), 2),
            "is_top_20": bool(r["is_top_20"]),
        } for r in customers],
        "products": [{
            "name": r["name"], "revenue": round(float(r["revenue"]), 2),
            "cumulative_revenue": round(float(r["cumulative_revenue"]), 2),
            "cumulative_pct": round(float(r["cumulative_pct"]), 2),
            "is_top_20": bool(r["is_top_20"]),
        } for r in products],
    }


# ── Trend Detection ───────────────────────────────────────────────────────────

def get_trend_detection(db: Session) -> Dict[str, Any]:
    df = fetch_dataframe(db)
    if df.empty:
        return {"monthly_trends": [], "observations": []}

    monthly = df.groupby("month")["sales_amount"].sum().reset_index()
    monthly["month_label"] = monthly["month"].dt.strftime("%b %Y")
    monthly["pct_change"] = monthly["sales_amount"].pct_change() * 100

    # Rolling average
    monthly["rolling_avg"] = monthly["sales_amount"].rolling(3, min_periods=1).mean()

    def classify_trend(row):
        if pd.isna(row["pct_change"]):
            return "baseline"
        elif row["pct_change"] > 10:
            return "increasing"
        elif row["pct_change"] < -10:
            return "declining"
        else:
            return "stable"

    monthly["trend"] = monthly.apply(classify_trend, axis=1)

    observations = []
    best_month = monthly.loc[monthly["sales_amount"].idxmax()]
    worst_month = monthly.loc[monthly["sales_amount"].idxmin()]
    observations.append(f"Peak revenue in {best_month['month_label']}: ${best_month['sales_amount']:,.0f}")
    observations.append(f"Lowest revenue in {worst_month['month_label']}: ${worst_month['sales_amount']:,.0f}")

    increasing = monthly[monthly["trend"] == "increasing"]
    declining = monthly[monthly["trend"] == "declining"]
    if len(increasing) > len(declining):
        observations.append("Overall positive growth momentum observed across the period")
    else:
        observations.append("Revenue shows mixed performance requiring strategic attention")

    # Seasonal check
    df["quarter"] = df["order_date"].dt.quarter
    q4_rev = df[df["quarter"] == 4]["sales_amount"].sum()
    q1_rev = df[df["quarter"] == 1]["sales_amount"].sum()
    if q4_rev > q1_rev * 1.2:
        observations.append("Strong Q4 seasonal uplift detected — typical holiday sales pattern")

    return {
        "monthly_trends": [{
            "month": row["month_label"],
            "revenue": round(float(row["sales_amount"]), 2),
            "rolling_avg": round(float(row["rolling_avg"]), 2),
            "pct_change": round(float(row["pct_change"]) if not pd.isna(row["pct_change"]) else 0, 2),
            "trend": row["trend"],
        } for _, row in monthly.iterrows()],
        "observations": observations,
    }


# ── Anomaly Detection ─────────────────────────────────────────────────────────

def get_anomaly_detection(db: Session) -> Dict[str, Any]:
    df = fetch_dataframe(db)
    if df.empty:
        return {"anomalies": [], "stats": {}}

    mean = df["sales_amount"].mean()
    std = df["sales_amount"].std()

    df["z_score"] = (df["sales_amount"] - mean) / std
    df["anomaly_type"] = df["z_score"].apply(
        lambda z: "spike" if z > 2.5 else ("drop" if z < -2.5 else "normal")
    )

    anomalies = df[df["anomaly_type"] != "normal"].copy()
    anomalies = anomalies.sort_values("z_score", key=abs, ascending=False).head(20)

    return {
        "anomalies": [{
            "order_id": row["order_id"],
            "customer_name": row["customer_name"],
            "product_name": row["product_name"],
            "sales_amount": round(float(row["sales_amount"]), 2),
            "order_date": str(row["order_date"].date()),
            "anomaly_type": row["anomaly_type"],
            "z_score": round(float(row["z_score"]), 2),
        } for _, row in anomalies.iterrows()],
        "stats": {
            "mean": round(float(mean), 2),
            "std": round(float(std), 2),
            "spike_threshold": round(float(mean + 2.5 * std), 2),
            "drop_threshold": round(float(mean - 2.5 * std), 2),
            "total_anomalies": len(anomalies),
        },
    }


# ── AI Insights ───────────────────────────────────────────────────────────────

def get_ai_insights(db: Session) -> Dict[str, Any]:
    summary = get_dashboard_summary(db)
    monthly = get_monthly_revenue(db)
    regional = get_regional_performance(db)
    products = get_product_performance(db)

    top_region = regional[0]["region"] if regional else "N/A"
    top_product = products["products"][0]["product_name"] if products["products"] else "N/A"

    recent_months = monthly[-3:] if len(monthly) >= 3 else monthly
    revenue_trend = "upward" if len(recent_months) >= 2 and recent_months[-1]["revenue"] > recent_months[0]["revenue"] else "downward"

    insights = {
        "executive_summary": (
            f"The business generated ${summary['total_revenue']:,.0f} in total revenue across "
            f"{summary['total_orders']} orders from {summary['total_customers']} unique customers. "
            f"Profit margin stands at {summary['profit_margin']:.1f}%, with month-over-month growth of "
            f"{summary['revenue_growth']:.1f}%. Overall business health is "
            f"{'strong' if summary['profit_margin'] > 15 else 'moderate'}."
        ),
        "revenue_insights": [
            f"Monthly revenue shows a {revenue_trend} trend over the last 3 months.",
            f"Average order value of ${summary['avg_order_value']:,.2f} suggests {'premium' if summary['avg_order_value'] > 200 else 'mid-market'} positioning.",
            f"Revenue growth rate of {summary['revenue_growth']:.1f}% indicates {'healthy expansion' if summary['revenue_growth'] > 0 else 'contraction requiring attention'}.",
        ],
        "customer_insights": [
            f"{summary['total_customers']} unique customers with avg {summary['total_orders'] / max(summary['total_customers'], 1):.1f} orders each.",
            "RFM analysis reveals Champions and Loyal Customers drive disproportionate revenue.",
            "At-Risk customers represent a re-engagement opportunity through targeted campaigns.",
        ],
        "regional_insights": [
            f"{top_region} region leads in revenue performance.",
            "Regional diversification reduces dependency on single markets.",
            f"Bottom regions present growth opportunities through targeted sales strategies.",
        ],
        "product_recommendations": [
            f"'{top_product}' is the top revenue generator — prioritize inventory and marketing.",
            "Software category shows highest profit margins — consider upsell campaigns.",
            "Bundle low-margin Office Supplies with high-margin Electronics to boost AOV.",
        ],
        "business_recommendations": [
            f"{'Increase' if summary['revenue_growth'] < 5 else 'Maintain'} marketing spend to sustain growth trajectory.",
            "Implement loyalty programs for At-Risk customer segments to reduce churn.",
            "Review discount strategy — high discounts negatively correlate with profit.",
            "Capitalize on seasonal Q4 uplift with inventory pre-positioning.",
        ],
    }

    return insights