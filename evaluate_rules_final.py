"""
Evaluation script for rule-based fraud detection (rules only).

This script:
  1. Creates a set of transaction dictionaries that are known to violate specific rules.
  2. Uses another set of clean transactions from the database.
  3. Runs the rule checker on each.
  4. Computes detection rate (true positive rate) and false positive rate.
  5. Prints a report.

Note: We do not persist the violated transactions to the database; we only use them
      for evaluation. This is acceptable for measuring the rule detection rate.
"""

import os
import sys
import tempfile
import shutil
from sqlite3 import dbapi2 as sqlite3
from typing import List, Tuple, Dict, Any

# Add the current directory to the path so we can import local modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# Import the Base and Transaction from load_transactions.py
from load_transactions import Base as BaseModel, Transaction as DBTransaction

# Import the rule checking function from rules_agent.py
from rules_agent import check_transaction, Transaction as RuleTransaction


def setup_test_database() -> tuple[sessionmaker, str]:
    """
    Create a temporary copy of the auditai.db database for testing (for clean transactions).
    Returns a sessionmaker for the temporary database and the path to the temporary database file.
    """
    # Create a temporary file
    tmp_fd, tmp_path = tempfile.mkstemp(suffix='.db')
    os.close(tmp_fd)  # We'll use SQLAlchemy to manage the connection

    # Copy the existing database
    shutil.copy2('auditai.db', tmp_path)

    # Create an engine and session for the temporary database
    engine = create_engine(f"sqlite:///{tmp_path}", future=True)
    # Ensure tables exist (they should from the copy)
    BaseModel.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine, future=True)
    return SessionLocal, tmp_path


def create_violating_transactions() -> list[dict]:
    """
    Create a list of transaction dictionaries, each designed to trigger exactly one rule.
    Returns a list of dicts, each with the transaction data and the expected violation type.
    """
    violations = []

    # Rule 1: large amount missing KYC (amount > 10000 and has_kyc == False)
    violations.append({
        "tx_id": 1001,  # arbitrary ID
        "expected": "large_amount_missing_kyc",
        "tx_dict": {
            "amount": 15000.0,
            "has_kyc": False,
            "is_cross_border": False,
            "account_inactive_days": 30,
            "tx_count_24h": 1,
            # Other fields can be arbitrary/default
            "step": 0,
            "type": "TRANSFER",
            "nameOrig": "C1000",
            "oldbalanceOrig": 10000.0,
            "newbalanceOrig": -5000.0,  # unrealistic but okay for test
            "nameDest": "M1000",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 5000.0,
            "isFraud": 0,
            "isFlaggedFraud": 0,
            "timestamp": "2023-01-01T00:00:00",
        }
    })

    # Rule 2: cross-border high amount (is_cross_border == True and amount > 5000)
    violations.append({
        "tx_id": 1002,
        "expected": "cross_border_high_amount",
        "tx_dict": {
            "amount": 6000.0,
            "has_kyc": True,
            "is_cross_border": True,
            "account_inactive_days": 30,
            "tx_count_24h": 1,
            "step": 0,
            "type": "TRANSFER",
            "nameOrig": "C1000",
            "oldbalanceOrig": 10000.0,
            "newbalanceOrig": 4000.0,
            "nameDest": "M1000",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 6000.0,
            "isFraud": 0,
            "isFlaggedFraud": 0,
            "timestamp": "2023-01-01T00:00:00",
        }
    })

    # Rule 3: dormant account reactivation (account_inactive_days > 180)
    violations.append({
        "tx_id": 1003,
        "expected": "dormant_reactivation",
        "tx_dict": {
            "amount": 1000.0,
            "has_kyc": True,
            "is_cross_border": False,
            "account_inactive_days": 200,  # > 180
            "tx_count_24h": 1,
            "step": 0,
            "type": "TRANSFER",
            "nameOrig": "C1000",
            "oldbalanceOrig": 5000.0,
            "newbalanceOrig": 4000.0,
            "nameDest": "M1000",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 1000.0,
            "isFraud": 0,
            "isFlaggedFraud": 0,
            "timestamp": "2023-01-01T00:00:00",
        }
    })

    # Rule 4: high velocity 24h (tx_count_24h > 5)
    violations.append({
        "tx_id": 1004,
        "expected": "high_velocity_24h",
        "tx_dict": {
            "amount": 1000.0,
            "has_kyc": True,
            "is_cross_border": False,
            "account_inactive_days": 30,
            "tx_count_24h": 10,  # > 5
            "step": 0,
            "type": "TRANSFER",
            "nameOrig": "C1000",
            "oldbalanceOrig": 5000.0,
            "newbalanceOrig": 4000.0,
            "nameDest": "M1000",
            "oldbalanceDest": 0.0,
            "newbalanceDest": 1000.0,
            "isFraud": 0,
            "isFlaggedFraud": 0,
            "timestamp": "2023-01-01T00:00:00",
        }
    })

    return violations


def get_clean_transactions(session, limit: int = 2) -> list[dict]:
    """
    Fetch a number of clean transactions from the database.
    Returns a list of dicts, each with transaction data and expected "none".
    """
    # Get the first `limit` transaction IDs
    stmt = select(DBTransaction.id).limit(limit)
    ids = [row[0] for row in session.execute(stmt).all()]

    clean_transactions = []
    for tx_id in ids:
        tx_db = session.get(DBTransaction, tx_id)
        if tx_db is None:
            continue
        # Build a dict from the database transaction, adding defaults for extra fields
        tx_dict = {
            "amount": float(tx_db.amount) if tx_db.amount is not None else 0.0,
            "step": tx_db.step,
            "type": tx_db.type,
            "nameOrig": tx_db.nameOrig,
            "oldbalanceOrig": float(tx_db.oldbalanceOrig) if tx_db.oldbalanceOrig is not None else 0.0,
            "newbalanceOrig": float(tx_db.newbalanceOrig) if tx_db.newbalanceOrig is not None else 0.0,
            "nameDest": tx_db.nameDest,
            "oldbalanceDest": float(tx_db.oldbalanceDest) if tx_db.oldbalanceDest is not None else 0.0,
            "newbalanceDest": float(tx_db.newbalanceDest) if tx_db.newbalanceDest is not None else 0.0,
            "isFraud": tx_db.isFraud,
            "isFlaggedFraud": tx_db.isFlaggedFraud,
            "timestamp": tx_db.timestamp.isoformat() if tx_db.timestamp else None,
            # Defaults for fields not in the DB model (assume clean values)
            "has_kyc": True,
            "is_cross_border": False,
            "account_inactive_days": 0,
            "tx_count_24h": 1,
        }
        clean_transactions.append({
            "tx_id": tx_id,
            "expected": "none",
            "tx_dict": tx_dict
        })

    return clean_transactions


def evaluate() -> None:
    """
    Main evaluation routine.
    """
    print("Setting up test database (for clean transactions)...")
    SessionLocal, db_path = setup_test_database()
    session = SessionLocal()
    print(f"Using test database: {db_path}")

    try:
        print("Creating violating transaction dictionaries...")
        violations = create_violating_transactions()
        print(f"Created {len(violations)} violating transaction dictionaries.")

        print("Fetching clean transactions from database...")
        clean_transactions = get_clean_transactions(session, limit=2)
        print(f"Fetched {len(clean_transactions)} clean transactions.")

        # Evaluate violating transactions
        true_positives = 0
        false_negatives = 0
        violation_details = []  # list of (tx_id, expected_violation, detected_violation)

        for v in violations:
            tx_id = v["tx_id"]
            expected = v["expected"]
            tx_dict = v["tx_dict"]
            detected_violations = check_transaction(tx_dict)
            detected = len(detected_violations) > 0
            if detected:
                true_positives += 1
                violation_details.append((tx_id, expected, ", ".join(detected_violations)))
            else:
                false_negatives += 1
                violation_details.append((tx_id, expected, "none"))

        # Evaluate clean transactions
        false_positives = 0
        true_negatives = 0
        false_positive_details = []  # list of (tx_id, detected_violation)

        for c in clean_transactions:
            tx_id = c["tx_id"]
            expected = c["expected"]
            tx_dict = c["tx_dict"]
            detected_violations = check_transaction(tx_dict)
            detected = len(detected_violations) > 0
            if detected:
                false_positives += 1
                false_positive_details.append((tx_id, ", ".join(detected_violations)))
            else:
                true_negatives += 1

        # Calculate rates
        total_violated = len(violations)
        total_clean = len(clean_transactions)

        detection_rate = true_positives / total_violated if total_violated > 0 else 0.0
        false_positive_rate = false_positives / total_clean if total_clean > 0 else 0.0

        # Print report
        print("\n" + "="*60)
        print("RULE-BASED DETECTION EVALUATION REPORT (RULES ONLY)")
        print("="*60)
        print(f"Total violated samples: {total_violated}")
        print(f"Total clean samples:    {total_clean}")
        print()
        print("DETECTION RATE (True Positive Rate):")
        print(f"  {true_positives}/{total_violated} = {detection_rate:.2%}")
        print()
        print("FALSE POSITIVE RATE:")
        print(f"  {false_positives}/{total_clean} = {false_positive_rate:.2%}")
        print()
        print("DETAILS FOR VIOLATED SAMPLES:")
        for tx_id, expected, detected in violation_details:
            status = "✓ DETECTED" if detected != "none" else "✗ MISSED"
            print(f"  TX {tx_id}: Expected={expected}, Detected={detected} [{status}]")
        print()
        print("DETAILS FOR FALSE POSITIVES (if any):")
        if false_positive_details:
            for tx_id, detected in false_positive_details:
                print(f"  TX {tx_id}: Incorrectly flagged as violating: {detected}")
        else:
            print("  None")
        print("="*60)

    finally:
        session.close()
        # Optionally delete the temporary database file
        os.unlink(db_path)
        print(f"\nCleaned up temporary database: {db_path}")


if __name__ == "__main__":
    evaluate()