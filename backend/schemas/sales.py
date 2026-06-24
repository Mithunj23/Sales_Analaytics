from pydantic import BaseModel
from datetime import date
from typing import Optional, List


class SaleBase(BaseModel):
    order_id: str
    customer_id: str
    customer_name: str
    product_name: str
    product_category: str
    region: str
    sales_amount: float
    quantity: int
    discount: float
    profit: float
    order_date: date


class SaleCreate(SaleBase):
    pass


class SaleResponse(SaleBase):
    id: int

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_profit: float
    avg_order_value: float
    revenue_growth: float
    profit_margin: float


class MonthlyRevenue(BaseModel):
    month: str
    revenue: float
    profit: float
    orders: int
    growth: Optional[float] = None


class RegionalPerformance(BaseModel):
    region: str
    revenue: float
    profit: float
    orders: int
    customers: int
    avg_order_value: float


class CustomerSegment(BaseModel):
    segment: str
    count: int
    revenue: float
    avg_recency: float
    avg_frequency: float
    avg_monetary: float


class ProductPerformance(BaseModel):
    product_name: str
    category: str
    total_revenue: float
    total_profit: float
    total_quantity: int
    order_count: int


class DiscountAnalysis(BaseModel):
    discount_range: str
    avg_revenue: float
    avg_profit: float
    order_count: int
    revenue_correlation: float
    profit_correlation: float


class ParetoItem(BaseModel):
    name: str
    revenue: float
    cumulative_revenue: float
    cumulative_pct: float
    is_top_20: bool


class TrendDetection(BaseModel):
    period: str
    value: float
    trend: str
    change_pct: float


class Anomaly(BaseModel):
    order_id: str
    customer_name: str
    sales_amount: float
    order_date: str
    anomaly_type: str
    z_score: float
