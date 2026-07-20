# AuditAI Roadmap

Deloitte capstone project. Target build, grouped by subsystem, with a 6-month milestone order.

## Feature list by subsystem

### 1. Data & ingestion
- Transaction ingestion pipeline (CSV/JSON/DB exports — PaySim + synthetic journal entries)
- Regulation corpus ingestion (RBI Master Directions, SOX, internal policy docs)
- Chunking + embedding into Qdrant
- Synthetic data generator with injected known violations — the ground-truth harness that makes the project measurable

### 2. Regulation RAG agent
- Vector search over the regulation corpus
- Clause retrieval per transaction/rule type
- Clause-level citation tracking (which document, which section) so every finding is traceable

### 3. Control-testing agent (deterministic rules)
Six rule types, all plain logic — no AI needed:
- Segregation of duties (same person created and approved)
- Approval-threshold breach
- Duplicate invoice/payment
- Weekend / backdated / out-of-period posting
- Round-number anomaly
- Benford's Law deviation

### 4. ML anomaly detection agent
- Isolation Forest for unsupervised outlier detection (the realistic case — real audit data rarely has labels)
- LightGBM as a supervised layer where labels do exist
- Anomaly scoring feeding into the ranking

### 5. Orchestration (LangGraph)
- Multi-agent workflow: retrieve → test → detect → synthesize
- Risk-based ranking of findings
- LLM-generated plain-language explanation per finding (e.g. "this invoice was paid twice, violating policy 4.2")

### 6. Review dashboard (React)
- Ranked findings list
- Evidence trail — source record and cited clause shown side by side
- Audit-readiness score
- Filtering and drill-down
- Human review actions (accept / reject / escalate)

### 7. Validation & metrics
- Precision/recall against injected anomalies
- Citation accuracy
- Coverage % vs. the 5% sampling baseline
- Estimated audit hours saved

This is the section that earns the KPI marks and is the one people skip — without it you have a demo, not a result.

### 8. Security & deployment
- Self-hosted LLM option via Ollama so financial data never leaves the org
- Role-based access control + audit logs
- Encryption in transit and at rest
- REST APIs for ERP integration (SAP, Tally, Oracle)
- Dockerized services

## Scoping

For a 6-month build, sections 1–5 plus the core of 6 and 7 are the must-ship set — a complete, demoable product. LightGBM, the audit-readiness score, live ERP connectors, and full RBAC are honest stretch items: describe them in the architecture, build them if time allows.

## 6-month milestone build order

Sequenced so the section-7 validation harness grows incrementally with each agent, instead of being bolted on at the end.

| Month | Focus | Deliverable |
|---|---|---|
| 1 | **Data foundation** — multi-format transaction ingestion; synthetic data generator with injected violations (built first, as the ground-truth harness); regulation corpus ingestion (RBI/SOX/policy) + chunking + embedding into Qdrant | Labeled synthetic data exists; regulation corpus is queryable |
| 2 | **Control-testing agent + RAG upgrade** — implement all 6 deterministic rules, replacing the current 4 ad-hoc rules; upgrade RAG to clause-level (doc + section) citation; start tracking precision/recall against the Month-1 harness as rules land | Rules agent passes its own eval suite; RAG cites specific clauses |
| 3 | **ML anomaly detection** — Isolation Forest (unsupervised, primary) merged into a unified ranking signal with rule violations; LightGBM only if labeled data + time allow (stretch) | Anomaly scores evaluated against the synthetic harness |
| 4 | **Orchestration + explanation layer** — full LangGraph multi-agent workflow (retrieve → test → detect → synthesize), replacing the current linear pipeline; risk-based ranking combining rules + anomaly + RAG relevance; LLM plain-language explanation per finding | End-to-end pipeline producing ranked, explained findings |
| 5 | **Dashboard + validation (KPI month)** — ranked findings list, evidence trail (source record + cited clause side by side), filtering/drill-down, accept/reject/escalate actions; full metrics (precision/recall, citation accuracy, coverage % vs. 5% baseline, estimated audit-hours saved); audit-readiness score if time allows (stretch) | Demoable dashboard plus a results doc with real numbers |
| 6 | **Hardening/security/stretch** — finalize self-hosted Ollama path, Dockerize all services end-to-end; minimal RBAC + audit logs (full RBAC is stretch); encryption in transit/at rest; ERP REST connectors (SAP/Tally/Oracle) only if time allows (stretch); final demo prep | Production-adjacent, demo-ready system |

## Current state vs. this roadmap

As of 2026-07-20, the repo implements a simplified early scaffold:

- **Ingestion (1):** `load_transactions.py` (PaySim) and `ingest_regulations.py` exist; no multi-corpus (RBI/SOX/policy) ingestion yet, no first-class synthetic-violation generator (only ad-hoc seeding in `evaluate_rules*.py`).
- **RAG (2):** `rag_agent.py` embeds + searches Qdrant + calls Ollama, citing at the regulation-ID level only — no clause-level citation.
- **Control-testing (3):** `rules_agent.py` has 4 rules (large amount + missing KYC, cross-border, dormant reactivation, high velocity), none of which are the 6 planned rules.
- **ML anomaly (4):** `anomaly_agent.py` is a simple z-score — no Isolation Forest, no LightGBM.
- **Orchestration (5):** `graph.py` wires a linear LangGraph pipeline (fetch → rules → anomaly → RAG → severity → store), not the full retrieve→test→detect→synthesize design.
- **Dashboard (6):** React frontend has Dashboard, Transactions, Ask the Regs, and Coverage pages, with a findings register and coverage strip — no evidence trail, audit-readiness score, or review actions yet.
- **Validation (7):** `EVALUATION_RESULTS.txt` shows 100% detection / 0% false positives on the existing 4 rules — a start, but no citation-accuracy or coverage-vs-baseline metrics yet.
- **Security/deployment (8):** `docker-compose.yml` containerizes postgres/qdrant/backend/frontend — no RBAC, audit logs, encryption, or ERP connectors yet.

There are also two backend implementations: `audit-ai/backend/main.py` (simplified in-memory mock, used for frontend dev) and root-level `graph.py` (the real agent-orchestrated pipeline). They are not currently unified.
