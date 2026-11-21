# AuditAI

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=white) ![Qdrant](https://img.shields.io/badge/Qdrant-DC244C?logo=qdrant&logoColor=white) ![Ollama](https://img.shields.io/badge/Ollama-000000?logo=ollama&logoColor=white)

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

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `QDRANT_HOST` | Qdrant host | `localhost` |
| `QDRANT_PORT` | Qdrant port | `6333` |
| `QDRANT_COLLECTION` | Qdrant collection holding the regulation embeddings | `regulation` |
| `OLLAMA_HOST` | URL of the Ollama server | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model used to answer regulation questions | `phi3:mini` in `graph.py`, `llama3` in `rag_agent.py` |
| `RAG_TOP_K` | Number of regulation passages retrieved per question | `1` |
| `VITE_API_TARGET` | Backend URL the Vite dev server proxies to | see `vite.config.js` |

## Evaluation

The rule-based detector was tested on 200 synthetic PaySim transactions with seeded violations. It detected 8/8 seeded violations with 0 false positives (see `EVALUATION_RESULTS.txt`). Tests are in `tests/`.

## Documentation

See [`docs/`](docs) for the project overview and [roadmap](docs/roadmap.md).
