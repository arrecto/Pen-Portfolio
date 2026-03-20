import json
import uuid
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.config import settings
from models.response import SingleResponse
from helpers.mcp import mcp_client
import main

router = APIRouter(prefix=settings.API_V1)


class ChatRequest(BaseModel):
    session_id: str
    query: str


@router.post("/client/embed", response_model=SingleResponse)
async def embed_file(files: list[UploadFile] = File(...)):
    results = []
    for file in files:
        content = await file.read()
        doc_id = str(uuid.uuid4())
        result = await mcp_client.embed_file(content, file.filename, doc_id)
        results.append(result)
    return SingleResponse(result=", ".join(results))


@router.post("/client/chat", response_model=SingleResponse)
async def chat(body: ChatRequest):
    result = await main.ai_agent.chat(body.query, body.session_id)
    return SingleResponse(result=result)


@router.post("/client/chat/stream")
async def chat_stream(body: ChatRequest):
    async def generate():
        async for chunk in main.ai_agent.stream_chat(body.query, body.session_id):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/client/documents", response_model=SingleResponse)
async def list_documents():
    result = await mcp_client.list_documents()
    return SingleResponse(result=result)


@router.delete("/client/document/{doc_id}", response_model=SingleResponse)
async def delete_document(doc_id: str):
    result = await mcp_client.delete_document(doc_id)
    return SingleResponse(result=result)


@router.delete("/client/data", response_model=SingleResponse)
async def delete_data():
    result = await mcp_client.delete_data()
    return SingleResponse(result=result)
