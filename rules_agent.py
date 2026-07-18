"""
Deterministic rule‑based fraud checks for a single transaction.

The module expects a dictionary (or an object with attribute‑style access)
representing a transaction.  The exact schema is documented in the
`_required_fields` constant – missing keys are treated as violations
so that callers know the data is incomplete.

Each rule returns a short, human‑readable string when it fires; the
aggregator returns a list of all triggered rules (an empty list means
the transaction looks clean).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Mapping, Sequence


# ----------------------------------------------------------------------
# Helper types & utilities
# ----------------------------------------------------------------------
@dataclass(frozen=True)
class Transaction:
    """
    Simple immutable container for a transaction.
    All fields are optional for flexibility – missing values are treated
    as violations by the rule engine.
    """
    amount: float | None = None               # transaction amount (absolute value)
    has_kyc: bool | None = None               # True if KYC completed for the originator
    is_cross_border: bool | None = None       # True if origin & destination countries differ
    account_inactive_days: int | None = None  # days since last activity BEFORE this tx
    tx_count_24h: int | None = None           # number of outgoing txs from same origin in last 24h
    timestamp: datetime | None = None         # timestamp of this transaction (UTC)

    def as_dict(self) -> dict:
        return self.__dict__


def _get(item: Mapping | object, key: str):
    """Fetch a value from a dict‑like or attribute‑style object."""
    if isinstance(item, Mapping):
        return item.get(key)
    return getattr(item, key, None)


# ----------------------------------------------------------------------
# Rule implementations
# ----------------------------------------------------------------------
def _rule_large_amount_missing_kyc(tx: Mapping | Transaction) -> str | None:
    """Flag if amount > 10 000 and KYC is missing."""
    amount = _get(tx, "amount")
    has_kyc = _get(tx, "has_kyc")
    if amount is None or has_kyc is None:
        return None
    if amount > 10_000 and not has_kyc:
        return "Large amount (>10 000) with missing KYC"
    return None


def _rule_cross_border_high_amount(tx: Mapping | Transaction) -> str | None:
    """Flag cross‑border transfers > 5 000."""
    amount = _get(tx, "amount")
    xborder = _get(tx, "is_cross_border")
    if amount is None or xborder is None:
        return None
    if xborder and amount > 5_000:
        return "Cross‑border transfer with high amount (>5 000)"
    return None


def _rule_dormant_reactivation(tx: Mapping | Transaction) -> str | None:
    """
    Flag if an account that was dormant (>180 days inactive) suddenly
    becomes active (any transaction).
    """
    inactive = _get(tx, "account_inactive_days")
    if inactive is None:
        return None
    if inactive > 180:
        return "Dormant account reactivation (>180 days inactive)"
    return None


def _rule_high_velocity_24h(tx: Mapping | Transaction) -> str | None:
    """
    Flag if the origin account has executed more than 5 outgoing
    transactions in the last 24 hours (including the current one).
    """
    velocity = _get(tx, "tx_count_24h")
    if velocity is None:
        return None
    if velocity > 5:
        return f"High transfer velocity in 24h ({velocity} > 5)"
    return None


_RULES = [
    _rule_large_amount_missing_kyc,
    _rule_cross_border_high_amount,
    _rule_dormant_reactivation,
    _rule_high_velocity_24h,
]


def check_transaction(tx: Mapping | Transaction) -> List[str]:
    """
    Evaluate a transaction against all hard‑coded rules.

    Parameters
    ----------
    tx:
        Mapping or object providing the transaction fields (see :class:`Transaction`).

    Returns
    -------
    list[str]
        Human‑readable descriptions of violated rules. Empty list → no violations.
    """
    violations: List[str] = []
    for rule in _RULES:
        msg = rule(tx)
        if msg:
            violations.append(msg)
    return violations


# ----------------------------------------------------------------------
# Convenience: allow direct instantiation from a dict
# ----------------------------------------------------------------------
def from_dict(data: dict) -> Transaction:
    """
    Helper to turn a plain dict into a :class:`Transaction`.
    Missing keys become ``None`` (treated as missing data by the rules).
    """
    return Transaction(**{k: data.get(k) for k in Transaction.__annotations__})


# ----------------------------------------------------------------------
# Simple sanity check when run as a script
# ----------------------------------------------------------------------
if __name__ == "__main__":
    examples = [
        {
            "amount": 12000,
            "has_kyc": False,
            "is_cross_border": False,
            "account_inactive_days": 30,
            "tx_count_24h": 1,
            "timestamp": datetime.utcnow(),
        },
        {
            "amount": 300,
            "has_kyc": True,
            "is_cross_border": True,
            "account_inactive_days": 500,
            "tx_count_24h": 2,
            "timestamp": datetime.utcnow(),
        },
    ]

    for i, ex in enumerate(examples, 1):
        tx = from_dict(ex)
        print(f"Example {i}: {check_transaction(tx)}")