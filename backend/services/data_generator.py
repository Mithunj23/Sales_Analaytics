import pandas as pd
import numpy as np
from datetime import date, timedelta
import random
import string


CUSTOMERS = [
    ("Alice Johnson", "C001"), ("Bob Smith", "C002"), ("Carol White", "C003"),
    ("David Brown", "C004"), ("Emma Davis", "C005"), ("Frank Miller", "C006"),
    ("Grace Wilson", "C007"), ("Henry Moore", "C008"), ("Iris Taylor", "C009"),
    ("Jack Anderson", "C010"), ("Karen Thomas", "C011"), ("Liam Jackson", "C012"),
    ("Mia Harris", "C013"), ("Noah Martin", "C014"), ("Olivia Garcia", "C015"),
    ("Peter Martinez", "C016"), ("Quinn Robinson", "C017"), ("Rachel Clark", "C018"),
    ("Sam Rodriguez", "C019"), ("Tina Lewis", "C020"), ("Ursula Lee", "C021"),
    ("Victor Walker", "C022"), ("Wendy Hall", "C023"), ("Xavier Allen", "C024"),
    ("Yara Young", "C025"), ("Zoe Hernandez", "C026"), ("Aaron King", "C027"),
    ("Bella Wright", "C028"), ("Carlos Lopez", "C029"), ("Diana Hill", "C030"),
    ("Ethan Scott", "C031"), ("Fiona Green", "C032"), ("George Adams", "C033"),
    ("Hannah Baker", "C034"), ("Ian Nelson", "C035"), ("Julia Carter", "C036"),
    ("Kevin Mitchell", "C037"), ("Laura Perez", "C038"), ("Mark Roberts", "C039"),
    ("Nancy Turner", "C040"),
]

PRODUCTS = [
    ("Laptop Pro 15", "Electronics", 1200, 300),
    ("Wireless Mouse", "Electronics", 35, 12),
    ("Mechanical Keyboard", "Electronics", 150, 45),
    ("4K Monitor", "Electronics", 450, 120),
    ("USB-C Hub", "Electronics", 60, 20),
    ("Noise Cancelling Headphones", "Electronics", 280, 85),
    ("Smartphone Stand", "Electronics", 25, 8),
    ("Webcam HD", "Electronics", 90, 28),
    ("Office Chair Deluxe", "Furniture", 380, 95),
    ("Standing Desk", "Furniture", 650, 180),
    ("Bookshelf Modern", "Furniture", 220, 60),
    ("Filing Cabinet", "Furniture", 175, 45),
    ("Desk Lamp LED", "Furniture", 55, 18),
    ("Whiteboard 4x6", "Furniture", 120, 35),
    ("Python Mastery Course", "Software", 199, 180),
    ("Project Manager Pro", "Software", 299, 270),
    ("Design Suite Annual", "Software", 599, 540),
    ("CRM Basic License", "Software", 149, 134),
    ("Analytics Dashboard Pro", "Software", 399, 360),
    ("Cloud Storage 1TB", "Software", 99, 89),
    ("Notebook Set Premium", "Office Supplies", 18, 7),
    ("Ballpoint Pens (50pk)", "Office Supplies", 12, 5),
    ("Sticky Notes Bulk", "Office Supplies", 15, 6),
    ("Printer Paper (500)", "Office Supplies", 22, 8),
    ("Stapler Heavy Duty", "Office Supplies", 28, 10),
    ("Highlighter Set", "Office Supplies", 10, 4),
    ("Ergonomic Mouse Pad", "Office Supplies", 20, 7),
    ("Adjustable Monitor Stand", "Office Supplies", 45, 16),
    ("Business Card Holder", "Office Supplies", 16, 6),
    ("Whiteboard Markers (12pk)", "Office Supplies", 14, 5),
]

REGIONS = ["North", "South", "East", "West", "Central"]


def generate_synthetic_data(n: int = 600) -> pd.DataFrame:
    """Generate realistic synthetic sales data."""
    np.random.seed(42)
    random.seed(42)

    start_date = date(2023, 1, 1)
    end_date = date(2024, 12, 31)
    date_range = (end_date - start_date).days

    records = []
    used_order_ids = set()

    # Seasonal weights: Q4 is stronger
    def get_seasonal_weight(d: date) -> float:
        month = d.month
        weights = {1: 0.7, 2: 0.75, 3: 0.85, 4: 0.9, 5: 0.95, 6: 1.0,
                   7: 0.95, 8: 0.9, 9: 1.0, 10: 1.1, 11: 1.3, 12: 1.4}
        return weights.get(month, 1.0)

    # Some customers buy more frequently (power users)
    customer_weights = np.random.dirichlet(np.ones(len(CUSTOMERS)) * 0.5) * len(CUSTOMERS)

    for i in range(n):
        # Pick order date with seasonality
        days_offset = int(np.random.beta(2, 2) * date_range)
        order_date = start_date + timedelta(days=days_offset)

        # Customer selection
        cust_idx = np.random.choice(len(CUSTOMERS), p=customer_weights / customer_weights.sum())
        customer_name, customer_id = CUSTOMERS[cust_idx]

        # Product selection
        product = random.choice(PRODUCTS)
        product_name, category, base_price, base_profit = product

        # Region selection with some skew
        region_weights = [0.22, 0.18, 0.25, 0.20, 0.15]
        region = np.random.choice(REGIONS, p=region_weights)

        # Quantity
        if category in ["Office Supplies"]:
            quantity = int(np.random.choice([1, 2, 3, 5, 10], p=[0.3, 0.25, 0.2, 0.15, 0.1]))
        else:
            quantity = int(np.random.choice([1, 2, 3], p=[0.7, 0.2, 0.1]))

        # Discount
        discount = round(np.random.choice([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
                                          p=[0.35, 0.15, 0.2, 0.15, 0.1, 0.03, 0.02]), 2)

        # Sales amount with seasonality
        seasonal = get_seasonal_weight(order_date)
        noise = np.random.normal(1.0, 0.1)
        sales_amount = round(base_price * quantity * (1 - discount) * seasonal * noise, 2)
        sales_amount = max(sales_amount, 1.0)

        # Profit (negatively impacted by high discounts)
        profit_margin = (base_profit / base_price) * (1 - discount * 1.5)
        profit = round(sales_amount * max(profit_margin, -0.1), 2)

        # Generate unique order ID
        while True:
            order_id = "ORD-" + "".join(random.choices(string.digits, k=6))
            if order_id not in used_order_ids:
                used_order_ids.add(order_id)
                break

        records.append({
            "order_id": order_id,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "product_name": product_name,
            "product_category": category,
            "region": region,
            "sales_amount": sales_amount,
            "quantity": quantity,
            "discount": discount,
            "profit": profit,
            "order_date": order_date,
        })

    df = pd.DataFrame(records)
    df = df.sort_values("order_date").reset_index(drop=True)
    return df
