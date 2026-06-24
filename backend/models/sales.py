from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from database.connection import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(String(50), index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    product_name = Column(String(100), nullable=False)
    product_category = Column(String(50), index=True, nullable=False)
    region = Column(String(50), index=True, nullable=False)
    sales_amount = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    discount = Column(Float, default=0.0)
    profit = Column(Float, nullable=False)
    order_date = Column(Date, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "customer_id": self.customer_id,
            "customer_name": self.customer_name,
            "product_name": self.product_name,
            "product_category": self.product_category,
            "region": self.region,
            "sales_amount": self.sales_amount,
            "quantity": self.quantity,
            "discount": self.discount,
            "profit": self.profit,
            "order_date": str(self.order_date),
        }
