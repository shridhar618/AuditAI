# AuditAI

An AI-powered audit assistant that checks financial transactions against regulations. It combines deterministic control rules, ML anomaly detection and a retrieval-augmented (RAG) regulation agent, with a React review dashboard.

## How it works

1. **Ingestion:** transactions are loaded from CSV (`load_transactions.py`) and regulations are embedded into a Qdrant vector store (`ingest_regulations.py`).
2. **Rules agent** (`rules_agent.py`): deterministic control tests such as large amounts with missing KYC, high-value cross-border transfers, dormant-account reactivation and high transaction velocity.
3. **Anomaly agent** (`anomaly_agent.py`): ML-based detection of unusual transactions.
4. **Regulation RAG agent** (`rag_agent.py`): embeds a question with Sentence-Transformers (`all-MiniLM-L6-v2`), retrieves matching regulation text from Qdrant, and has a local Ollama LLM answer using only that text, citing the regulation ID and snippet.
5. **Orchestration** (`graph.py`): connects the agents into a single audit flow.
6. **Dashboard** (`audit-ai/frontend`): React UI for transactions, findings, coverage and questions about regulations.

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI, Uvicorn |
| Data | PostgreSQL 15, Qdrant vector database |
| AI | Sentence-Transformers, Ollama (local LLM) |
| Frontend | React, Vite, React Router, Axios |
| Infrastructure | Docker, Docker Compose |

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/transactions` | List transactions |
| POST | `/api/upload-transactions` | Upload a transactions CSV |
| GET | `/api/findings` | List audit findings |
| POST | `/api/audit/{transaction_id}` | Audit one transaction |
| POST | `/api/ask` | Ask a question about regulations |

## Getting started

```bash
cd audit-ai/infra
docker compose up --build
```

This starts PostgreSQL, Qdrant, the backend and the frontend. The RAG agent also needs an [Ollama](https://ollama.com) server running locally (default port `11434`). Set `OLLAMA_MODEL` to choose the model.

## Evaluation

The rule-based detector was tested on 200 synthetic PaySim transactions with seeded violations. It detected 8/8 seeded violations with 0 false positives (see `EVALUATION_RESULTS.txt`). Tests are in `tests/`.

## Documentation

See [`docs/`](docs) for the project overview and [roadmap](docs/roadmap.md).
