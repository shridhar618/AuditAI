"""
Unit tests for the deterministic rule engine in ``rules_agent.py``.

The suite checks:
* at least one rule fires (violation case)
* no rules fire (clean case)
"""

from datetime import datetime, timedelta

import pytest

from rules_agent import Transaction, check_transaction, from_dict


def _base_tx() -> dict:
    """A clean transaction that satisfies all rule thresholds."""
    now = datetime.utcnow()
    return {
        "amount": 1000,                     # below all amount thresholds
        "has_kyc": True,
        "is_cross_border": False,
        "account_inactive_days": 30,        # active account
        "tx_count_24h": 2,                  # low velocity
        "timestamp": now,
    }


def test_clean_transaction_returns_no_violations():
    tx = from_dict(_base_tx())
    assert check_transaction(tx) == []


def test_large_amount_missing_kyc_triggers():
    data = _base_tx()
    data.update({"amount": 15000, "has_kyc": False})  # violates rule 1
    tx = from_dict(data)
    violations = check_transaction(tx)
    assert any("Large amount" in v for v in violations)
    # Ensure no other false positives
    assert all("Large amount" in v or "Cross‑border" not in v for v in violations)


def test_cross_border_high_amount_triggers():
    data = _base_tx()
    data.update({"amount": 8000, "is_cross_border": True})  # violates rule 2
    tx = from_dict(data)
    violations = check_transaction(tx)
    assert any("Cross‑border" in v for v in violations)


def test_dormant_reactivation_triggers():
    data = _base_tx()
    data.update({"account_inactive_days": 200})  # >180 days inactive
    tx = from_dict(data)
    violations = check_transaction(tx)
    assert any("Dormant account" in v for v in violations)


def test_high_velocity_24h_triggers():
    data = _base_tx()
    data.update({"tx_count_24h": 7})  # >5 transactions in 24h
    tx = from_dict(data)
    violations = check_transaction(tx)
    assert any("High transfer velocity" in v for v in violations)


def test_multiple_violations_returned():
    data = _base_tx()
    data.update(
        {
            "amount": 20000,      # large amount
            "has_kyc": False,     # missing KYC
            "is_cross_border": True,
            "account_inactive_days": 200,
            "tx_count_24h": 10,
        }
    )
    tx = from_dict(data)
    violations = check_transaction(tx)
    # Expect at least the four distinct messages
    assert len(violations) >= 4
    assert any("Large amount" in v for v in violations)
    assert any("Cross‑border" in v for v in violations)
    assert any("Dormant account" in v for v in violations)
    assert any("High transfer velocity" in v for v in violations)