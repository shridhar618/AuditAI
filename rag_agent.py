"""
RAG agent that:
  1. Embeds a user query (or transaction description) with a Sentence‑Transformers model.
  2. Queries a local Qdrant collection named "regulation" for the top‑k matching vectors.
  3. Builds a prompt that forces the local Ollama LLM to answer *only* using the retrieved
     regulation text.
  4. Returns the LLM answer together with the regulation ID and the exact snippet that was
     used as context.

Assumptions
-----------
* Qdrant is reachable at http://localhost:6333 (default) and already contains a collection
  called "regulation".  Each point in that collection must have:
      - vector: the embedding of the regulation text
      - payload: {"regulation_id": <str>, "text": <str>}
* An Ollama server is running locally on the default port 11434 and serves a model
  (e.g. "llama3", "mistral", …).  The model name can be overridden with the
  environment variable OLLAMA_MODEL.
* The embedding model used for both ingestion and query is
  "sentence-transformers/all-MiniLM-L6-v2" (≈384‑dim, lightweight).  Change
  EMBED_MODEL_NAME if you used a different vector size when ingesting.

Installation (once):
    pip install fastapi uvicorn sentence-transformers qdrant-client requests

Run:
    uvicorn rag_agent:app --host 0.0.0.0 --port 8000

Example request:
    curl -X POST "http://localhost:8000/ask" \
         -H "Content-Type: application/json" \
         -d '{"query": "What are the capital requirements under Basel III?"}'
"""

import os
from typing import List, Dict, Any

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models

# -------------------------- Configuration --------------------------
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "regulation")
EMBED_MODEL_NAME = os.getenv(
    "EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")  # change if you use another model
TOP_K = int(os.getenv("RAG_TOP_K", "3"))  # how many snippets to retrieve

# -------------------------- FastAPI app --------------------------
app = FastAPI(title="RAG Agent – Regulation Q&A")


class AskRequest(BaseModel):
    query: str  # free‑text description of the transaction or a direct question


class AskResponse(BaseModel):
    answer: str
    regulation_id: str
    regulation_text: str
    score: float | None = None  # similarity score from Qdrant (optional)


# -------------------------- Helpers --------------------------
def get_embedder() -> SentenceTransformer:
    """Lazy‑load the SentenceTransformer model."""
    return SentenceTransformer(EMBED_MODEL_NAME)


def get_qdrant() -> QdrantClient:
    """Create a lightweight client to the local Qdrant instance."""
    return QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def embed_text(text: str) -> List[float]:
    """Return a dense vector for the supplied text."""
    model = get_embedder()
    # encode returns a np.ndarray; .tolist() makes it JSON‑serialisable for Qdrant
    return model.encode([text], normalize_embeddings=True)[0].tolist()


def query_qdrant(vector: List[float], limit: int = TOP_K) -> List[qdrant_models.ScoredPoint]:
    """Search the regulation collection and return the top hits."""
    client = get_qdrant()
    try:
        # Use the query_points method for qdrant-client >= 1.0.0
        results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=vector,
            limit=limit,
            with_payload=True,  # we need regulation_id and text
        )
        return results.points
    except Exception as exc:
        # Fallback to the old search method for backward compatibility
        try:
            results = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=vector,
                limit=limit,
                with_payload=True,  # we need regulation_id and text
            )
            return results
        except Exception as exc2:
            raise HTTPException(
                status_code=500,
                detail=f"Qdrant query failed: {exc}; fallback also failed: {exc2}",
            ) from exc2


def build_prompt(question: str, contexts: List[Dict[str, str]]) -> str:
    """
    Construct a prompt that strictly grounds the answer in the supplied regulation
    snippets.  We ask the model to answer *only* using the provided text and to
    cite the regulation ID.
    """
    ctx_parts = []
    for i, ctx in enumerate(contexts, start=1):
        ctx_parts.append(
            f"[Regulation {i}] ID: {ctx['regulation_id']}\nText:\n{ctx['text']}\n"
        )
    context_block = "\n---\n".join(ctx_parts)

    prompt = f"""You are a regulatory assistant.  Answer the user's question **using only** the regulation text provided below.
Do not add any information that is not present in the supplied text.
If the question cannot be answered from the given text, say that the information is not available in the provided regulation.

{context_block}

Question: {question}

Answer (include the regulation ID(s) you relied on and quote the relevant snippet):"""
    return prompt


def call_ollama(prompt: str) -> str:
    """
    Send the prompt to a locally running Ollama instance and return the generated text.
    We use the `/api/generate` endpoint with stream=false for simplicity.
    """
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        # optional: you can tweak temperature, top_p, etc.
        "options": {"temperature": 0.0},  # deterministic for grounding
    }
    try:
        resp = requests.post(url, json=payload, timeout=120)  # increased timeout
        resp.raise_for_status()
        data = resp.json()
        # Ollama returns {"model": "...", "created_at": "...", "response": "..."}
        return data.get("response", "").strip()
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama request failed: {exc}",
        ) from exc


# -------------------------- API Endpoint --------------------------
@app.post("/ask", response_model=AskResponse)
async def ask_endpoint(req: AskRequest):
    """
    Main RAG endpoint:
      1. Embed the user query.
      2. Retrieve top‑k regulation snippets from Qdrant.
      3. Build a grounding prompt.
      4. Ask the local Ollama model.
      5. Return the answer plus the source citation.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty")

    # 1️⃣ Embed query
    query_vec = embed_text(req.query)

    # 2️⃣ Retrieve relevant regulation snippets
    hits = query_qdrant(query_vec, limit=TOP_K)
    if not hits:
        raise HTTPException(
            status_code=404,
            detail="No regulation vectors found in the collection.",
        )

    # Build a list of dicts with the needed payload fields
    contexts: List[Dict[str, str]] = []
    for hit in hits:
        payload = hit.payload or {}
        reg_id = payload.get("regulation_id", "unknown")
        text = payload.get("text", "")
        if not text:
            continue  # skip malformed points
        contexts.append(
            {
                "regulation_id": reg_id,
                "text": text.strip(),
                # optionally include score: "score": hit.score
            }
        )

    if not contexts:
        raise HTTPException(
            status_code=500,
            detail="Retrieved points lack required payload fields (regulation_id, text).",
        )

    # 3️⃣ Build prompt that forces grounding
    prompt = build_prompt(req.query, contexts)

    # 4️⃣ Ask Ollama
    answer = call_ollama(prompt)

    # 5️⃣ Return answer + citation (we return the top hit as the primary source)
    top = contexts[0]
    return AskResponse(
        answer=answer,
        regulation_id=top["regulation_id"],
        regulation_text=top["text"],
        score=hits[0].score if hits else None,
    )


# ----------------------------------------------------------------------
# To run:  uvicorn rag_agent:app --host 0.0.0.0 --port 8000
# ----------------------------------------------------------------------
if __name__ == "__main__":
    # Allow running via `python rag_agent.py` for quick testing
    import uvicorn

    uvicorn.run("rag_agent:app", host="0.0.0.0", port=8000, reload=True)