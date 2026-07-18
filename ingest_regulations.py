"""
Initialize Qdrant collection with sample regulation texts.
Run this before starting the API server to ensure the RAG agent has data to search.
"""

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
import uuid

# Configuration
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
COLLECTION_NAME = "regulation"
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Sample regulation texts (you can expand this list)
REGULATIONS = [
    {
        "id": "REG-001",
        "text": "The institution must maintain adequate capital to cover its risks. Capital requirements shall be calculated according to the standardized approach described in Part III of Regulation (EU) No 575/2013.",
    },
    {
        "id": "REG-002",
        "text": "Institutions must report large exposures exceeding 10% of eligible capital on a quarterly basis. The report shall include counterparty details, exposure amount and any collateral received.",
    },
    {
        "id": "REG-003",
        "text": "Anti‑money‑laundering (AML) procedures require customer due diligence (CDD) before establishing a business relationship. Enhanced due diligence is mandatory for politically exposed persons (PEPs).",
    },
    {
        "id": "REG-004",
        "text": "The General Data Protection Regulation (GDPR) mandates that personal data be processed lawfully, fairly and transparently. Data subjects have the right to access, rectify and erase their data.",
    },
    {
        "id": "REG-005",
        "text": "Under the Basel III framework, the liquidity coverage ratio (LCR) must be ≥100% under a 30‑day stress scenario. High‑quality liquid assets (HQLA) are weighted at 100%.",
    },
]

def main():
    # Initialize embedding model
    print(f"Loading embedding model: {EMBED_MODEL_NAME}")
    model = SentenceTransformer(EMBED_MODEL_NAME)
    vector_size = model.get_sentence_embedding_dimension()
    print(f"Embedding dimension: {vector_size}")

    # Connect to Qdrant
    print(f"Connecting to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
    qc = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

    # Check if collection exists; if yes, delete and recreate for clean slate
    collections = qc.get_collections().collections
    collection_names = [c.name for c in collections]
    if COLLECTION_NAME in collection_names:
        print(f"Collection '{COLLECTION_NAME}' exists. Deleting...")
        qc.delete_collection(collection_name=COLLECTION_NAME)

    # Create collection
    print(f"Creating collection '{COLLECTION_NAME}'")
    qc.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=qdrant_models.VectorParams(
            size=vector_size, distance=qdrant_models.Distance.COSINE
        ),
    )

    # Prepare points
    points = []
    for reg in REGULATIONS:
        # Generate embedding
        vector = model.encode([reg["text"]], normalize_embeddings=True)[0].tolist()
        point = qdrant_models.PointStruct(
            id=str(uuid.uuid4()),  # UUID as string ID
            vector=vector,
            payload={
                "regulation_id": reg["id"],
                "text": reg["text"],
            },
        )
        points.append(point)

    # Upload points in batches
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        qc.upsert(collection_name=COLLECTION_NAME, points=batch)
        print(f"Uploaded batch {i//batch_size + 1}/{(len(points)-1)//batch_size + 1}")

    print(f"✅ Successfully inserted {len(points)} regulation vectors into collection '{COLLECTION_NAME}'.")

if __name__ == "__main__":
    main()