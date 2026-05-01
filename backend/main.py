import uuid
import json
import logging
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag.document_processor import extract_text, chunk_text
from rag.vector_store import vector_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_FILE_SIZE_MB = 50
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "md"}

app = FastAPI(
    title="RAG Application API",
    description="Retrieval-Augmented Generation API powered by Claude",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage] = []
    doc_ids: Optional[List[str]] = None


class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    total_chunks: int
    message: str


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/documents", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB",
        )

    doc_id = str(uuid.uuid4())

    try:
        text = extract_text(content, ext)
        if not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from the document.")

        chunks = chunk_text(text, doc_id, file.filename)
        vector_store.add_chunks(chunks)
        logger.info(f"Indexed document {file.filename} ({doc_id}) with {len(chunks)} chunks")

        return DocumentResponse(
            doc_id=doc_id,
            filename=file.filename,
            total_chunks=len(chunks),
            message="Document uploaded and indexed successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents")
async def list_documents():
    docs = vector_store.list_documents()
    return {"documents": docs, "total": len(docs)}


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    chunk_count = vector_store.get_document_chunk_count(doc_id)
    if chunk_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    vector_store.delete_document(doc_id)
    logger.info(f"Deleted document {doc_id} ({chunk_count} chunks removed)")
    return {"message": "Document deleted successfully", "doc_id": doc_id}


@app.post("/api/reset")
async def reset_session():
    vector_store.clear_all()
    logger.info("Session reset — all documents cleared")
    return {"message": "Session cleared"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    from rag.rag_engine import rag_stream

    history = [{"role": m.role, "content": m.content} for m in request.history]

    async def generate():
        async for chunk in rag_stream(request.query, history, request.doc_ids):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
