from rag_agent import embed_text, query_qdrant

# Test embedding
text = "This is a test"
vec = embed_text(text)
print(f"Embedding length: {len(vec)}")

# Test querying
hits = query_qdrant(vec, limit=1)
print(f"Number of hits: {len(hits)}")
if hits:
    print(f"First hit payload: {hit.payload}")
else:
    print("No hits")