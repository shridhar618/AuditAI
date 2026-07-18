"""
Simple anomaly detection for transaction amounts using z‑score.

The module provides two public helpers:
* ``score_transaction(tx)`` → float   (absolute z‑score of the amount)
* ``score_transactions(txs)`` → List[float]   (z‑scores for a batch)

A transaction is considered anomalous when its absolute z‑score exceeds a
threshold (default 2.0, i.e. roughly the 95th percentile for a normal
distribution).  The functions deliberately return the raw score so callers
can choose their own cutoff.

The implementation is intentionally naïve: it computes mean and standard
deviation from the *sample* it is given.  For a production system you would
likely want a rolling window or a separate reference distribution.
"""

from __future__ import annotations

import math
from statistics import mean, stdev
from typing import Iterable, List, Mapping, Sequence, Union

# ----------------------------------------------------------------------
# Helper types & utilities
# ----------------------------------------------------------------------
Number = Union[int, float]


def _get_amount(tx: Mapping | object) -> float | None:
    """
    Extract the numeric ``amount`` from a transaction-like object.
    Returns ``None`` if the field is missing or not a number.
    """
    if isinstance(tx, Mapping):
        raw = tx.get("amount")
    else:
        raw = getattr(tx, "amount", None)

    if raw is None:
        return None
    try:
        return float(raw)
    except (TypeError, ValueError):
        return None


# ----------------------------------------------------------------------
# Core scoring
# ----------------------------------------------------------------------
def _z_score(value: float, data: Sequence[float]) -> float:
    """
    Return the z‑score of ``value`` relative to ``data``.
    If the standard deviation is zero (all values identical) we return 0.0.
    """
    if len(data) < 2:
        return 0.0
    m = mean(data)
    try:
        s = stdev(data)
    except StatisticsError:  # catches zero variance
        return 0.0
    if s == 0:
        return 0.0
    return (value - m) / s


def score_transaction(tx: Mapping | object) -> float:
    """
    Compute the absolute z‑score of a single transaction's amount
    *relative to a reference group*.

    NOTE: This function **requires** the caller to pass in a reference
    distribution somehow – the signature above is deliberately simple but
    unrealistic.  In practice you would call ``score_transactions`` on a
    batch and then pick the score for the item of interest, or you would
    maintain a running mean/stddev.

    For the sake of the exercise we provide a batch‑oriented helper
    (see ``score_transactions``) and leave the single‑shot version as a
    thin wrapper that assumes the transaction *is* the entire population
    (which yields a score of 0.0).

    Parameters
    ----------
    tx:
        Mapping or object with an ``amount`` field.

    Returns
    -------
    float
        Absolute z‑score. 0.0 when the amount cannot be determined or
        when the deviation is zero.
    """
    amount = _get_amount(tx)
    if amount is None:
        return 0.0
    # Degenerate case: single‑point sample → z‑score = 0
    return abs(_z_score(amount, [amount]))


def score_transactions(txs: Iterable[Mapping | object]) -> List[float]:
    """
    Compute absolute z‑scores for the ``amount`` field of many transactions.

    Parameters
    ----------
    txs:
        Iterable of transaction‑like objects (each must expose an ``amount``).

    Returns
    -------
    list[float]
        Absolute z‑scores in the same order as the input.  Missing or
        non‑numeric amounts yield 0.0.
    """
    amounts: List[float] = []
    for t in txs:
        a = _get_amount(t)
        if a is not None:
            amounts.append(a)
        else:
            amounts.append(float("nan"))  # placeholder to keep indices aligned

    # If we have fewer than two valid numbers, every score is 0.0
    valid = [a for a in amounts if not math.isnan(a)]
    if len(valid) < 2:
        return [0.0] * len(txs)

    m = mean(valid)
    s = stdev(valid)
    if s == 0:
        return [0.0] * len(txs)

    scores: List[float] = []
    for a in amounts:
        if math.isnan(a):
            scores.append(0.0)
        else:
            scores.append(abs((a - m) / s))
    return scores


# ----------------------------------------------------------------------
# Convenience helpers (optional)
# ----------------------------------------------------------------------
def is_anomalous(
    tx: Mapping | object, *, threshold: float = 2.0
) -> bool:
    """
    Convenience wrapper: ``True`` when the transaction's amount z‑score
    exceeds ``threshold`` (default 2.0 ≈ 95 % cutoff for a normal dist.).
    """
    return score_transaction(tx) > threshold


def flag_anomalies(
    txs: Iterable[Mapping | object], *, threshold: float = 2.0
) -> List[bool]:
    """
    Return a boolean mask (same length as input) where ``True`` indicates
    an anomalous amount (|z| > threshold).
    """
    scores = score_transactions(txs)
    return [s > threshold for s in scores]


# ----------------------------------------------------------------------
# Simple sanity check when run as a script
# ----------------------------------------------------------------------
if __name__ == "__main__":
    # Example data: mostly harmless, one obvious outlier
    sample = [
        {"amount": 100},
        {"amount": 120},
        {"amount": 90},
        {"amount": 110},
        {"amount": 1000},  # <-- outlier
        {"amount": 95},
    ]

    scores = score_transactions(sample)
    print("Amounts:", [s["amount"] for s in sample])
    print("z‑scores:", [round(s, 3) for s in scores])
    print("Anomalous (|z|>2)?", [s > 2.0 for s in scores])