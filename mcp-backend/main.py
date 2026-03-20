from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from helpers.mcp import mcp_client
from helpers.agent import AIAgent
from helpers.database import init_db
from endpoints.v1 import client

ai_agent: AIAgent | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ai_agent
    await init_db()
    await mcp_client.connect()
    ai_agent = AIAgent(mcp_client)
    yield
    await mcp_client.cleanup()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"result": "Hello this is the backend service of an MCP Project"}

app.include_router(client.router, tags=['client'])