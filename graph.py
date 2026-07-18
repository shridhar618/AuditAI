"""
Graph-based orchestrator for the AuditAI agents using LangGraph.
Provides a single FastAPI endpoint POST /audit/{transaction_id} that runs:
  1. Rules agent (deterministic fraud rules)
  2. Anomaly agent (z‑score on amount)
  3. RAG agent (retrieve regulation & ask Ollama for grounded explanation)

Persists each run into a `findings` table and exposes:
  GET /findings               – list findings (filterable by ?severity=)
  GET /findings/{finding_id}  – get a single finding with its citation
  GET /transactions           – list transaction IDs (optional limit)
  POST /ask                   – direct RAG query (used by Ask the Regs page)

Returns a combined JSON with:
{
    "transaction_id": int,
    "severity": "low"|"medium"|"high",
    "rule_violations": [str, ...],
    "anomaly_score": float,
    "rag_answer": str,
    "regulation_id": str,
    "regulation_text": str
}
"""

import os
import json
from typing import TypedDict, List, Any, Dict, Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    func,
    select,
    case,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from langgraph.graph import StateGraph, END

# Local agent imports
from rules_agent import check_transaction, from_dict as rules_from_dict
from anomaly_agent import score_transactions
from rag_agent import embed_text, query_qdrant, call_ollama, build_prompt

# Reuse the SQLAlchemy base and Transaction model from load_transactions.py
from load_transactions import Base as BaseModel, Transaction as DBTransaction

# -------------------------- Configuration --------------------------
# Use SQLite for simplicity in demo; can be overridden by DATABASE_URL env var
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./auditai.db",  # SQLite file in current directory
)
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "regulation")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")
TOP_K = int(os.getenv("RAG_TOP_K", "1"))  # we only need the top match for citation

# -------------------------- ORM: Findings table --------------------------
Base = BaseModel  # reuse the same Base from load_transactions
# Debug: print the tables already in the metadata
print("Tables in Base.metadata before defining Finding:", list(Base.metadata.tables.keys()))

class Finding(Base):
    __tablename__ = "findings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    severity = Column(String(10), nullable=False)  # low / medium / high
    rule_violations = Column(JSON, nullable=False)  # list of strings
    anomaly_score = Column(Float, nullable=False)
    rag_answer = Column(Text, nullable=False)
    regulation_id = Column(String(50), nullable=False)
    regulation_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Optional relationship back to transaction (if needed)
    # transaction = relationship("Transaction", back_populates="findings")


# Ensure the table exists (creates if missing)
def _init_db():
    from sqlalchemy import create_engine
    engine = create_engine(DATABASE_URL, future=True)
    Base.metadata.create_all(engine)  # creates transactions (if not) + findings

_init_db()


# -------------------------- State Definition --------------------------
class AuditState(TypedDict, total=False):
    transaction_id: int
    transaction_data: Dict[str, Any]
    rule_violations: List[str]
    anomaly_score: float
    rag_answer: str
    regulation_id: str
    regulation_text: str
    severity: str  # derived


# -------------------------- Helper Functions --------------------------
def get_db_session():
    from sqlalchemy import create_engine
    engine = create_engine(DATABASE_URL, future=True)
    Session = sessionmaker(bind=engine, future=True)
    return Session()


def fetch_transaction(state: AuditState) -> AuditState:
    """Load a transaction from Postgres by ID and store it in the state."""
    tx_id = state["transaction_id"]
    with get_db_session() as session:
        stmt = select(DBTransaction).where(DBTransaction.id == tx_id)
        result = session.execute(stmt).scalar_one_or_none()
        if result is None:
            raise ValueError(f"Transaction {tx_id} not found")
        # Convert ORM instance to a plain dict for downstream agents
        tx_dict = {
            "amount": float(result.amount),
            "step": result.step,
            "type": result.type,
            "nameOrig": result.nameOrig,
            "oldbalanceOrig": float(result.oldbalanceOrig),
            "newbalanceOrig": float(result.newbalanceOrig),
            "nameDest": result.nameDest,
            "oldbalanceDest": float(result.oldbalanceDest),
            "newbalanceDest": float(result.newbalanceDest),
            "isFraud": int(result.isFraud),
            "isFlaggedFraud": int(result.isFlaggedFraud),
            "timestamp": result.timestamp.isoformat() if result.timestamp else None,
        }
        # Add any extra fields that the rules/anomaly agents expect:
        # For demo we set plausible defaults; in a real system these would come from
        # enrichment/KYC tables.
        tx_dict.setdefault("has_kyc", True)  # placeholder
        tx_dict.setdefault("is_cross_border", False)  # placeholder
        tx_dict.setdefault("account_inactive_days", 30)  # placeholder
        tx_dict.setdefault("tx_count_24h", 1)  # placeholder
        state["transaction_data"] = tx_dict
    return state


def run_rules(state: AuditState) -> AuditState:
    tx = state["transaction_data"]
    # The rules agent expects a dict or object with the fields it uses.
    violations = check_transaction(tx)
    state["rule_violations"] = violations
    return state


def run_anomaly(state: AuditState) -> AuditState:
    tx = state["transaction_data"]
    # score_transactions expects an iterable; we pass a single-item list.
    scores = score_transactions([tx])
    # score_transactions returns absolute z‑score
    state["anomaly_score"] = float(scores[0]) if scores else 0.0
    return state


def run_rag(state: AuditState) -> AuditState:
    tx = state["transaction_data"]
    # Build a concise natural-language description of the transaction for querying.
    desc_parts = [
        f"Amount {tx['amount']:.2f}",
        f"Type {tx.get('type', 'UNKNOWN')}",
        f"From {tx.get('nameOrig', '???')} to {tx.get('nameDest', '???')}",
    ]
    if tx.get("timestamp"):
        desc_parts.append(f"at {tx['timestamp']}")
    query_text = ", ".join(desc_parts)

    # Embed and search Qdrant
    vec = embed_text(query_text)
    hits = query_qdrant(vec, limit=TOP_K)
    if not hits:
        raise RuntimeError("No regulation vectors found in Qdrant")
    top = hits[0]
    payload = top.payload or {}
    regulation_id = payload.get("regulation_id", "unknown")
    regulation_text = payload.get("text", "").strip()

    # Build prompt asking the LLM to judge relevance using ONLY the regulation text.
    prompt = f"""Using only the regulation text below, decide whether the described transaction is relevant to this regulation.
If it is relevant, explain why; if not, explain why not.
Regulation ID: {regulation_id}
Regulation Text:
{regulation_text}

Transaction Description:
{query_text}

Answer:"""

    answer = call_ollama(prompt)
    state["regulation_id"] = regulation_id
    state["regulation_text"] = regulation_text
    state["rag_answer"] = answer.strip()
    return state


def compute_severity(state: AuditState) -> AuditState:
    """Derive a simple severity label from rules and anomaly score."""
    violations = state.get("rule_violations", [])
    score = state.get("anomaly_score", 0.0)
    # Heuristic: any rule violation => high; else if anomaly > 2 => medium; else low.
    if violations:
        severity = "high"
    elif score > 2.0:
        severity = "medium"
    else:
        severity = "low"
    state["severity"] = severity
    return state


def store_finding(state: AuditState) -> AuditState:
    """Persist the audit result into the findings table."""
    tx_id = state["transaction_id"]
    with get_db_session() as session:
        finding = Finding(
            transaction_id=tx_id,
            severity=state["severity"],
            rule_violations=state.get("rule_violations", []),
            anomaly_score=state.get("anomaly_score", 0.0),
            rag_answer=state.get("rag_answer", ""),
            regulation_id=state.get("regulation_id", ""),
            regulation_text=state.get("regulation_text", ""),
        )
        session.add(finding)
        session.commit()
        # Optionally, we could fetch the generated id back, but not needed for response.
    return state


# -------------------------- Build Graph --------------------------
def build_graph() -> StateGraph:
    workflow = StateGraph(AuditState)

    # Add nodes
    workflow.add_node("fetch_transaction", fetch_transaction)
    workflow.add_node("run_rules", run_rules)
    workflow.add_node("run_anomaly", run_anomaly)
    workflow.add_node("run_rag", run_rag)
    workflow.add_node("compute_severity", compute_severity)
    workflow.add_node("store_finding", store_finding)

    # Define edges (sequential)
    workflow.set_entry_point("fetch_transaction")
    workflow.add_edge("fetch_transaction", "run_rules")
    workflow.add_edge("run_rules", "run_anomaly")
    workflow.add_edge("run_anomaly", "run_rag")
    workflow.add_edge("run_rag", "compute_severity")
    workflow.add_edge("compute_severity", "store_finding")
    workflow.add_edge("store_finding", END)

    return workflow.compile()


# Compile the graph once at import time
app_graph = build_graph()


# -------------------------- FastAPI App --------------------------
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from typing import List as TypingList

app = FastAPI(title="AuditAI Orchestrator")


def _finding_to_dict(f: Finding) -> dict:
    """Convert ORM Finding to a JSON-serializable dict."""
    return {
        "id": f.id,
        "transaction_id": f.transaction_id,
        "severity": f.severity,
        "rule_violations": f.rule_violations if isinstance(f.rule_violations, list) else json.loads(f.rule_violations),
        "anomaly_score": f.anomaly_score,
        "rag_answer": f.rag_answer,
        "regulation_id": f.regulation_id,
        "regulation_text": f.regulation_text,
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


@app.post("/audit/{transaction_id}")
async def audit_transaction(transaction_id: int):
    """
    Run the full audit pipeline for a given transaction ID.
    Returns a JSON with the combined results and persists the finding.
    """
    try:
        # Initial state
        initial_state: AuditState = {"transaction_id": transaction_id}
        # Run the graph
        final_state = app_graph.invoke(initial_state)
        # Ensure all expected keys exist (they should)
        response = {
            "transaction_id": final_state.get("transaction_id"),
            "severity": final_state.get("severity", "low"),
            "rule_violations": final_state.get("rule_violations", []),
            "anomaly_score": final_state.get("anomaly_score", 0.0),
            "rag_answer": final_state.get("rag_answer", ""),
            "regulation_id": final_state.get("regulation_id", ""),
            "regulation_text": final_state.get("regulation_text", ""),
        }
        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/findings")
def list_findings(severity: Optional[str] = Query(None, description="Filter by severity: low, medium, high")):
    """
    List all audit findings, optionally filtered by severity.
    Results are ordered by severity (high > medium > low) then most recent first.
    """
    with get_db_session() as session:
        stmt = select(Finding)
        if severity:
            if severity not in ("low", "medium", "high"):
                raise HTTPException(status_code=400, detail="Invalid severity value")
            stmt = stmt.where(Finding.severity == severity)
        # Order by severity (custom) then created_at desc
        severity_case = (
            case(
                (Finding.severity == "high", 3),
                (Finding.severity == "medium", 2),
                (Finding.severity == "low", 1),
                else_=0,
            ).desc()
        )
        stmt = stmt.order_by(severity_case, Finding.created_at.desc())
        results = session.execute(stmt).scalars().all()
        return [_finding_to_dict(r) for r in results]


@app.get("/findings/{finding_id}")
def get_finding(finding_id: int):
    """
    Retrieve a single finding by its ID, including the citation (regulation_id/text).
    """
    with get_db_session() as session:
        finding = session.get(Finding, finding_id)
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")
        return _finding_to_dict(finding)


@app.get("/transactions")
def list_transactions(limit: int = Query(100, description="Maximum number of transaction IDs to return")):
    """
    Return a list of transaction IDs (useful for the frontend to pick a target).
    """
    with get_db_session() as session:
        stmt = select(DBTransaction.id).limit(limit)
        ids = [row[0] for row in session.execute(stmt).all()]
        return {"transaction_ids": ids}


@app.post("/ask")
async def ask_question(payload: dict):
    """
    Direct RAG endpoint used by the Ask the Regs page.
    Expects { "query": "..." } and returns answer + citation.
    """
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query must not be empty")
    try:
        vec = embed_text(query)
        hits = query_qdrant(vec, limit=TOP_K)
        if not hits:
            raise RuntimeError("No regulation vectors found in Qdrant")
        top = hits[0]
        payload = top.payload or {}
        regulation_id = payload.get("regulation_id", "unknown")
        regulation_text = payload.get("text", "").strip()
        prompt = f"""Using only the regulation text below, decide whether the described transaction is relevant to this regulation.
If it is relevant, explain why; if not, explain why not.
Regulation ID: {regulation_id}
Regulation Text:
{regulation_text}

Transaction Description:
{query}

Answer:"""
        answer = call_ollama(prompt)
        return {
            "answer": answer.strip(),
            "regulation_id": regulation_id,
            "regulation_text": regulation_text,
            "score": float(hits[0].score) if hits else None,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# Serve static frontend files (built with Vite)
frontend_dist_path = os.path.join(os.path.dirname(__file__), "audit-ai", "frontend", "dist")
if os.path.isdir(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="static")
else:
    # If the dist folder does not exist yet, we can still run the API; frontend will need to be served separately.
    pass


# Optional: allow running with `python graph.py` for quick dev
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("graph:app", host="0.0.0.0", port=8000, reload=False)