from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from database.connection import init_db, SessionLocal
from routes.api import router
from services.data_generator import generate_synthetic_data
from sqlalchemy import text

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    db = SessionLocal()
    try:
        count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar()
        if count == 0:
            print("🌱 Seeding database with synthetic data...")
            df = generate_synthetic_data(600)
            records = df.to_dict("records")
            insert_stmt = text("""
                INSERT INTO sales (order_id, customer_id, customer_name, product_name,
                    product_category, region, sales_amount, quantity, discount, profit, order_date)
                VALUES (:order_id, :customer_id, :customer_name, :product_name,
                    :product_category, :region, :sales_amount, :quantity, :discount, :profit, :order_date)
                ON CONFLICT (order_id) DO NOTHING
            """)
            batch_size = 500
            for i in range(0, len(records), batch_size):
                db.execute(insert_stmt, records[i:i + batch_size])
            db.commit()
            print(f"✅ Seeded {len(df)} sales records")
        else:
            print(f"📊 Database has {count} existing records")
    except Exception as e:
        print(f"❌ Seed error: {e}")
        db.rollback()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Sales Analytics Dashboard API",
    description="Production-grade sales analytics REST API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
def root():
    return {"message": "Sales Analytics Dashboard API", "docs": "/docs"}
