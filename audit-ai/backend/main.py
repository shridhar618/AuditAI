from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import uvicorn
from datetime import datetime
import csv
import io

app = FastAPI()


class AskRequest(BaseModel):
    query: str


# Initialize with sample transactions
transactions = [
    {"id": 1, "step": 1, "type": "TRANSFER", "amount": 125000.00, "from": "C100001", "to": "C200014"},
    {"id": 2, "step": 1, "type": "CASH_OUT", "amount": 9800.50, "from": "C100002", "to": "M348921"},
    {"id": 3, "step": 2, "type": "PAYMENT", "amount": 430.20, "from": "C100003", "to": "M983402"},
    {"id": 4, "step": 2, "type": "TRANSFER", "amount": 248000.00, "from": "C100004", "to": "C200018"},
]

REGULATIONS = {
    "AML-EDD-001": "Enhanced due diligence should be applied to unusually large transactions, rapid movement of funds, and customers or counterparties presenting elevated money laundering risk.",
    "BASEL-LIQ-001": "Institutions should maintain adequate liquidity buffers and monitor large exposures that may create concentration or funding risks.",
    "GDPR-DSR-001": "Data subjects have rights to access, rectify, erase, restrict processing of, and receive copies of their personal data where applicable.",
}

findings = [
    {
        "id": 1,
        "transaction_id": 4,
        "severity": "high",
        "anomaly_score": 0.91,
        "rule_violations": [
            "Large value transfer exceeds review threshold",
            "Counterparty requires enhanced due diligence",
        ],
        "regulation_id": "AML-EDD-001",
        "regulation_text": REGULATIONS["AML-EDD-001"],
        "rag_answer": "The transaction is unusually large and should be reviewed under enhanced due diligence controls before clearing.",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
]


def parse_paysim_csv(csv_content: str):
    """Convert PaySim CSV format to internal transaction format."""
    # Parse CSV
    reader = csv.DictReader(io.StringIO(csv_content))
    parsed_transactions = []

    for row in reader:
        # Convert to internal format
        transaction = {
            "step": int(row["step"]),
            "type": row["type"],
            "amount": float(row["amount"]),
            "from": row["nameOrig"],
            "to": row["nameDest"],
        }
        parsed_transactions.append(transaction)

    return parsed_transactions


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "audit-ai-backend"
    }


@app.get("/api/transactions")
def list_transactions():
    return {
        "transaction_ids": [transaction["id"] for transaction in transactions],
        "transactions": transactions,
    }


@app.post("/api/upload-transactions")
async def upload_transactions(file: UploadFile = File(...)):
    # Read file content
    content = await file.read()
    csv_content = content.decode("utf-8")

    # Parse CSV
    new_transactions = parse_paysim_csv(csv_content)

    # Assign IDs and add to transactions
    start_id = len(transactions) + 1
    for i, txn in enumerate(new_transactions):
        txn_with_id = {
            "id": start_id + i,
            "step": txn["step"],
            "type": txn["type"],
            "amount": txn["amount"],
            "from": txn["from"],
            "to": txn["to"],
        }
        transactions.append(txn_with_id)

    return {
        "message": f"Successfully uploaded {len(new_transactions)} transactions",
        "uploaded_count": len(new_transactions),
        "total_transactions": len(transactions),
    }


@app.get("/api/findings")
def list_findings():
    return findings


@app.post("/api/audit/{transaction_id}")
def run_audit(transaction_id: int):
    transaction = next((item for item in transactions if item["id"] == transaction_id), None)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    amount = transaction["amount"]
    severity = "high" if amount >= 100000 else "medium" if amount >= 10000 else "low"
    score = min(0.99, 0.35 + (amount / 300000))
    violations = []

    if amount >= 100000:
        violations.append("Large value transfer exceeds review threshold")
    if transaction["type"] in {"TRANSFER", "CASH_OUT"}:
        violations.append(f"{transaction['type']} transaction requires counterparty screening")
    if not violations:
        violations.append("No hard rule violation; sampled for routine audit review")

    finding = {
        "id": len(findings) + 1,
        "transaction_id": transaction_id,
        "severity": severity,
        "anomaly_score": round(score, 2),
        "rule_violations": violations,
        "regulation_id": "AML-EDD-001",
        "regulation_text": REGULATIONS["AML-EDD-001"],
        "rag_answer": "The audit score is based on amount, transaction type, and counterparty review requirements.",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    findings.insert(0, finding)
    return finding


@app.post("/api/ask")
def ask_regulations(request: AskRequest):
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")

    lowered = query.lower()
    if "gdpr" in lowered or "data subject" in lowered:
        regulation_id = "GDPR-DSR-001"
    elif "liquidity" in lowered or "basel" in lowered or "exposure" in lowered:
        regulation_id = "BASEL-LIQ-001"
    else:
        regulation_id = "AML-EDD-001"

    regulation_text = REGULATIONS[regulation_id]
    return {
        "answer": f"Based on {regulation_id}, the relevant control expectation is: {regulation_text}",
        "regulation_id": regulation_id,
        "regulation_text": regulation_text,
        "score": 0.87,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)