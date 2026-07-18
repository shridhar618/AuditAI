"""
Evaluation script for rule-based fraud detection.

This script:
  1. Copies the production database to a temporary file.
  2. Injects known violations into a subset of transactions.
  3. Leaves another subset as clean (no modifications).
  4. Runs the audit pipeline (via the graph module) on each test transaction.
  5. Computes detection rate (true positive rate) and false positive rate based on rule violations.
  6. Prints a report.

Usage:
    python evaluate_rules.py
"""

import os
import sys
import tempfile
import shutil
from sqlite3 import dbapi2 as sqlite3
from typing import List, Tuple, Dict, Any

# Add the current directory to the path so we can import local modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, select, update, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker

# Import the Base and Transaction from load_transactions.py
from load_transactions import Base as BaseModel, Transaction as DBTransaction

# Import the audit pipeline functions from graph.py
# We'll reuse the fetch_transaction and run_rules functions, but we need to
# adapt them to use our test session.
from graph import fetch_transaction, run_rules, get_db_session as original_get_db_session


def setup_test_database() -> tuple[sessionmaker, str]:
    """
    Create a temporary copy of the auditai.db database for testing.
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


def inject_violations(session, num_per_rule: int = 2) -> tuple[list[int], list[int], dict[int, str]]:
    """
    Select transactions and modify them to have known violations.
    Returns:
        violated_ids: list of transaction IDs that were modified
        clean_ids: list of transaction IDs left untouched
        violation_map: dict mapping transaction ID to a description of the violation injected
    """
    # Fetch all transaction IDs
    all_ids = [row[0] for row in session.execute(select(DBTransaction.id)).all()]

    # We'll use the first N*4 for violations and the next N for clean (adjust if needed)
    needed = num_per_rule * 4 + num_per_rule  # 4 rule types, each with num_per_rule samples, plus clean set
    if len(all_ids) < needed:
        raise ValueError(f"Not enough transactions in database. Need at least {needed}, got {len(all_ids)}")

    violated_ids = []
    violation_map = {}  # tx_id -> description of what we changed
    clean_ids = []

    # We'll iterate over the list and assign:
    #   indices 0 to (num_per_rule*4 - 1) for violations (in blocks of num_per_rule per rule)
    #   indices (num_per_rule*4) to (num_per_rule*4 + num_per_rule - 1) for clean

    # Rule 1: large amount missing KYC (amount > 10000 and has_kyc == False)
    for i in range(num_per_rule):
        tx_id = all_ids[i]
        tx = session.get(DBTransaction, tx_id)
        if tx is None:
            continue
        # Modify to trigger rule 1
        tx.amount = 15000.0   # > 10000
        tx.has_kyc = False    # missing KYC
        # Leave other fields as they are (should not trigger other rules ideally)
        violated_ids.append(tx_id)
        violation_map[tx_id] = "large_amount_missing_kyc"

    # Rule 2: cross-border high amount (is_cross_border == True and amount > 5000)
    for i in range(num_per_rule):
        tx_id = all_ids[num_per_rule + i]
        tx = session.get(DBTransaction, tx_id)
        if tx is None:
            continue
        tx.amount = 6000.0   # > 5000
        tx.is_cross_border = True
        violated_ids.append(tx_id)
        violation_map[tx_id] = "cross_border_high_amount"

    # Rule 3: dormant account reactivation (account_inactive_days > 180)
    for i in range(num_per_rule):
        tx_id = all_ids[2*num_per_rule + i]
        tx = session.get(DBTransaction, tx_id)
        if tx is None:
            continue
        tx.account_inactive_days = 200  # > 180
        violated_ids.append(tx_id)
        violation_map[tx_id] = "dormant_reactivation"

    # Rule 4: high velocity 24h (tx_count_24h > 5)
    for i in range(num_per_rule):
        tx_id = all_ids[3*num_per_rule + i]
        tx = session.get(DBTransaction, tx_id)
        if tx is None:
            continue
        tx.tx_count_24h = 10  # > 5
        violated_ids.append(tx_id)
        violation_map[tx_id] = "high_velocity_24h"

    # Clean set: next num_per_rule transactions, leave unmodified
    clean_start = 4 * num_per_rule
    clean_ids = all_ids[clean_start:clean_start + num_per_rule]

    # Commit the changes
    session.commit()

    return violated_ids, clean_ids, violation_map


def restore_original_data(session, violated_ids: list[int], violation_map: dict[int, str]):
    """
    Restore the original values for the violated transactions (optional, since we are using a copy).
    This function is not strictly necessary because we are working on a copy that will be discarded.
    """
    # We could reload the original values from the backup, but for simplicity we skip.
    pass


def run_audit_on_transaction(tx_id: int, session) -> dict:
    """
    Run the audit pipeline for a single transaction using the provided session.
    We'll reuse the functions from graph.py but we need to override the DB session.
    """
    # Temporarily replace the get_db_session function in graph module with one that returns our test session
    import graph
    original_get_db_session = graph.get_db_session
    graph.get_db_session = lambda: session

    try:
        # Run the audit pipeline by calling the graph's functions directly
        # We'll mimic what the audit endpoint does: call the graph with initial state
        from graph import AuditState, app_graph

        initial_state: AuditState = {"transaction_id": tx_id}
        final_state = app_graph.invoke(initial_state)
        return final_state
    finally:
        # Restore the original function
        graph.get_db_session = original_get_db_session


def evaluate() -> None:
    """
    Main evaluation routine.
    """
    print("Setting up test database...")
    SessionLocal, db_path = setup_test_database()
    session = SessionLocal()
    print(f"Using test database: {db_path}")

    try:
        print("Injecting violations...")
        violated_ids, clean_ids, violation_map = inject_violations(session, num_per_rule=2)
        print(f"Injected violations into {len(violated_ids)} transactions.")
        print(f"Using {len(clean_ids)} clean transactions for false positive test.")

        # Evaluate violated transactions
        true_positives = 0
        false_negatives = 0
        violation_details = []  # list of (tx_id, expected_violation, detected_violation)

        for tx_id in violated_ids:
            expected = violation_map[tx_id]
            result = run_audit_on_transaction(tx_id, session)
            violations = result.get('rule_violations', [])
            detected = len(violations) > 0
            if detected:
                true_positives += 1
                violation_details.append((tx_id, expected, ", ".join(violations)))
            else:
                false_negatives += 1
                violation_details.append((tx_id, expected, "none"))

        # Evaluate clean transactions
        false_positives = 0
        true_negatives = 0
        false_positive_details = []  # list of (tx_id, detected_violation)

        for tx_id in clean_ids:
            result = run_audit_on_transaction(tx_id, session)
            violations = result.get('rule_violations', [])
            detected = len(violations) > 0
            if detected:
                false_positives += 1
                false_positive_details.append((tx_id, ", ".join(violations)))
            else:
                true_negatives += 1

        # Calculate rates
        total_violated = len(violated_ids)
        total_clean = len(clean_ids)

        detection_rate = true_positives / total_violated if total_violated > 0 else 0.0
        false_positive_rate = false_positives / total_clean if total_clean > 0 else 0.0

        # Print report
        print("\n" + "="*60)
        print("RULE-BASED DETECTION EVALUATION REPORT")
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