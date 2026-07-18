"""
Load a synthetic PaySim‑style CSV into a PostgreSQL table using SQLAlchemy.

Usage:
    python load_transactions.py \
        --db-url postgresql+psycopg2://user:pw@localhost:5432/auditai \
        [--csv path/to/paysim.csv]   # omit to generate a 200‑row sample
"""

import argparse
import os
import random
from datetime import datetime, timedelta

import pandas as pd
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ----------------------------------------------------------------------
# 1️⃣  Synthetic PaySim data generator (≈200 rows)
# ----------------------------------------------------------------------
def generate_paysim_sample(n_rows: int = 200) -> pd.DataFrame:
    """Return a DataFrame that mimics the PaySim columns we need."""
    random.seed(42)
    steps = list(range(n_rows))
    # Simple transaction types from the original PaySim paper
    types = ["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT", "PAYMENT"]
    # Mostly legit, a few frauds
    is_fraud = [0] * (n_rows - 20) + [1] * 20
    random.shuffle(is_fraud)

    data = {
        "step": steps,
        "type": [random.choice(types) for _ in range(n_rows)],
        "amount": [round(random.uniform(1, 100_000), 2) for _ in range(n_rows)],
        "nameOrig": [f"C{random.randint(1000,9999)}" for _ in range(n_rows)],
        "oldbalanceOrig": [round(random.uniform(0, 500_000), 2) for _ in range(n_rows)],
        "newbalanceOrig": [round(random.uniform(0, 500_000), 2) for _ in range(n_rows)],
        "nameDest": [f"M{random.randint(1000,9999)}" for _ in range(n_rows)],
        "oldbalanceDest": [round(random.uniform(0, 500_000), 2) for _ in range(n_rows)],
        "newbalanceDest": [round(random.uniform(0, 500_000), 2) for _ in range(n_rows)],
        "isFraud": is_fraud,
        "isFlaggedFraud": [0] * n_rows,  # keep simple
    }

    df = pd.DataFrame(data)
    # Add a timestamp column (optional but handy)
    base = datetime(2023, 1, 1)
    df["timestamp"] = [base + timedelta(seconds=int(s * 10)) for s in df["step"]]
    return df


# ----------------------------------------------------------------------
# 2️⃣  SQLAlchemy model
# ----------------------------------------------------------------------
Base = declarative_base()


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    step = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    nameOrig = Column(String(50), nullable=False)
    oldbalanceOrig = Column(Float, nullable=False)
    newbalanceOrig = Column(Float, nullable=False)
    nameDest = Column(String(50), nullable=False)
    oldbalanceDest = Column(Float, nullable=False)
    newbalanceDest = Column(Float, nullable=False)
    isFraud = Column(Integer, nullable=False)
    isFlaggedFraud = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False)


# ----------------------------------------------------------------------
# 3️⃣  Main routine
# ----------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Load PaySim CSV into Postgres")
    parser.add_argument(
        "--db-url",
        required=True,
        help="SQLAlchemy URL, e.g. postgresql+psycopg2://user:pw@localhost:5432/db",
    )
    parser.add_argument(
        "--csv",
        help="Path to an existing PaySim CSV. If omitted a 200‑row sample is generated.",
    )
    args = parser.parse_args()

    # ------------------------------------------------------------------
    # Load or generate CSV
    # ------------------------------------------------------------------
    if args.csv and os.path.exists(args.csv):
        print(f"📥 Loading CSV from {args.csv}")
        df = pd.read_csv(args.csv)
    else:
        print("🛠 Generating a synthetic PaySim sample (~200 rows)…")
        df = generate_paysim_sample()
        # Optionally persist the generated CSV for inspection
        df.to_csv("paysim_sample.csv", index=False)
        print("💾 Sample written to paysim_sample.csv")

    # ------------------------------------------------------------------
    # Create engine & table
    # ------------------------------------------------------------------
    engine = create_engine(args.db_url, echo=False, future=True)
    Base.metadata.create_all(engine)  # creates table if not exists
    Session = sessionmaker(bind=engine, future=True)
    session = Session()

    # ------------------------------------------------------------------
    # Bulk insert using pandas → SQLAlchemy Core (fast)
    # ------------------------------------------------------------------
    print(f"🚚 Inserting {len(df)} rows into {args.db_url} …")
    df.to_sql(
        name=Transaction.__tablename__,
        con=engine,
        if_exists="append",
        index=False,
        method="multi",
    )
    session.commit()
    session.close()
    print("✅ Done!")


if __name__ == "__main__":
    main()