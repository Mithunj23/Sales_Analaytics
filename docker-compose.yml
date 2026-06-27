from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database.connection import init_db, SessionLocal
from routes.api import router
from services.data_generator import generate_synthetic_data
from sqlalchemy import text

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")


def seed_database():
    """Create table and seed with synthetic data if empty. Retries on connection failure."""
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Database connection attempt {attempt}/{max_retries}...")
            init_db()  # creates table if not exists
            db = SessionLocal()
            try:
                count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar()
                logger.info(f"Sales table has {count} rows")

                if count == 0:
                    logger.info("🌱 Seeding database with 600 synthetic sales records...")
                    df = generate_synthetic_data(600)
                    records = df.to_dict("records")

                    insert_stmt = text("""
                        INSERT INTO sales (
                            order_id, customer_id, customer_name, product_name,
                            product_category, region, sales_amount, quantity,
                            discount, profit, order_date
                        ) VALUES (
                            :order_id, :customer_id, :customer_name, :product_name,
                            :product_category, :region, :sales_amount, :quantity,
                            :discount, :profit, :order_date
                        ) ON CONFLICT (order_id) DO NOTHING
                    """)

                    # Bulk insert in batches
                    for i in range(0, len(records), 500):
                        db.execute(insert_stmt, records[i:i + 500])
                    db.commit()

                    # Verify the insert worked
                    final_count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar()
                    logger.info(f"✅ Seeded successfully — {final_count} records now in database")
                else:
                    logger.info(f"📊 Using existing {count} records — skipping seed")

                return  # success — exit retry loop

            except Exception as e:
                logger.error(f"❌ Database operation failed: {e}")
                db.rollback()
                raise
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Attempt {attempt} failed: {e}")
            if attempt < max_retries:
                wait = attempt * 3
                logger.info(f"Retrying in {wait} seconds...")
                time.sleep(wait)
            else:
                logger.error("All retry attempts exhausted. App will start without seeded data.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title="Sales Analytics Dashboard API",
    description="Production-grade sales analytics REST API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allows all origins — safe for a portfolio project
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health():
    """Health check — also verifies database connectivity and row count."""
    db = SessionLocal()
    try:
        count = db.execute(text("SELECT COUNT(*) FROM sales")).scalar()
        return {
            "status": "healthy",
            "version": "1.0.0",
            "database": "connected",
            "sales_records": count,
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Sales Analytics Dashboard API — visit /health or /docs"}