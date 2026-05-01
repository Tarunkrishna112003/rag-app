import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer


EMBED_MODEL = "all-MiniLM-L6-v2"
COLLECTION_NAME = "rag_documents"


class VectorStore:
    def __init__(self):
        self._client = chromadb.EphemeralClient(
            settings=Settings(anonymized_telemetry=False),
        )
        self._collection = None
        self._embedder: Optional[SentenceTransformer] = None

    def _get_collection(self):
        if self._collection is None:
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def _get_embedder(self):
        if self._embedder is None:
            self._embedder = SentenceTransformer(EMBED_MODEL)
        return self._embedder

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        if not chunks:
            return
        texts = [c["text"] for c in chunks]
        embeddings = self._get_embedder().encode(texts, show_progress_bar=False).tolist()
        self._get_collection().add(
            ids=[c["id"] for c in chunks],
            embeddings=embeddings,
            documents=texts,
            metadatas=[c["metadata"] for c in chunks],
        )

    def query(self, query_text: str, top_k: int = 5, doc_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        embedding = self._get_embedder().encode([query_text], show_progress_bar=False).tolist()
        where = {"doc_id": {"$in": doc_ids}} if doc_ids else None
        results = self._get_collection().query(
            query_embeddings=embedding,
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        output = []
        for i in range(len(results["ids"][0])):
            output.append({
                "id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i],
            })
        return output

    def delete_document(self, doc_id: str) -> None:
        collection = self._get_collection()
        existing = collection.get(where={"doc_id": doc_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])

    def list_documents(self) -> List[Dict[str, Any]]:
        collection = self._get_collection()
        results = collection.get(include=["metadatas"])
        seen = {}
        for meta in results["metadatas"]:
            doc_id = meta.get("doc_id")
            if doc_id and doc_id not in seen:
                seen[doc_id] = {
                    "doc_id": doc_id,
                    "filename": meta.get("filename", "unknown"),
                    "total_chunks": meta.get("total_chunks", 0),
                }
        return list(seen.values())

    def get_document_chunk_count(self, doc_id: str) -> int:
        collection = self._get_collection()
        results = collection.get(where={"doc_id": doc_id})
        return len(results["ids"])

    def clear_all(self) -> None:
        try:
            self._client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
        self._collection = None


vector_store = VectorStore()
