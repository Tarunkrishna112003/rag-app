import os
import json
import asyncio
from typing import AsyncGenerator, List, Optional
from groq import AsyncGroq
from .vector_store import vector_store


TOP_K = int(os.getenv("TOP_K_RESULTS", "5"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are a helpful assistant with access to a knowledge base of documents.
When answering questions, use the provided context from the knowledge base.
Always cite your sources by mentioning the document filename.
If the context doesn't contain enough information, say so clearly and answer based on general knowledge.
Be concise, accurate, and helpful."""

_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))


def build_context(chunks: list) -> str:
    if not chunks:
        return "No relevant context found in the knowledge base."
    parts = []
    for i, chunk in enumerate(chunks, 1):
        filename = chunk["metadata"].get("filename", "unknown")
        score = chunk["score"]
        parts.append(f"[Source {i}: {filename} (relevance: {score:.2f})]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


async def rag_stream(
    query: str,
    chat_history: List[dict],
    doc_ids: Optional[List[str]] = None,
) -> AsyncGenerator[str, None]:
    chunks = await asyncio.to_thread(
        vector_store.query, query, TOP_K, doc_ids if doc_ids else None
    )
    context = build_context(chunks)

    sources = [
        {
            "filename": c["metadata"].get("filename"),
            "chunk_index": c["metadata"].get("chunk_index"),
            "score": round(c["score"], 3),
        }
        for c in chunks
    ]

    yield f"__SOURCES__{json.dumps(sources)}__SOURCES_END__"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in chat_history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    user_message = f"""Context from knowledge base:
{context}

User question: {query}"""
    messages.append({"role": "user", "content": user_message})

    stream = await _client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=1024,
        stream=True,
    )

    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content
