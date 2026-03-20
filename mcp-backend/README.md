# MCP Backend

A FastAPI service that connects to the embeddings MCP server and exposes a REST API for file embedding and AI-powered chat with conversation memory.

## Stack

- **FastAPI** — REST API framework
- **MCP** — Client connection to the embeddings MCP server via streamable-http
- **Mistral AI** — `mistral-large-latest` for tool-calling and chat orchestration

## Prerequisites

The embeddings MCP server must be running on port 8001 before starting this service.

```bash
# In the embeddings/ directory
python embeddings.py
```

## Setup

```bash
# Install uv if not already installed
pip install uv

# Install dependencies
uv sync

# Create environment file
cp .env.example .env
```

Edit `.env` with your values:

```env
API_V1=/api/v1
MCP_HOST=localhost
MCP_PORT=8001
MISTRAL_API_KEY=your_mistral_api_key_here
```

## Running

```bash
uvicorn main:app --reload
```

API available at `http://localhost:8000`.

## Endpoints

### `POST /api/v1/client/embed`

Upload a file to be chunked and stored in ChromaDB via the MCP server.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | PDF file to embed |

**Response:**
```json
{ "result": "File embedded successfully" }
```

---

### `POST /api/v1/client/chat`

Send a message to the AI agent. Conversation history is maintained per `session_id`.

**Request:** `application/json`

```json
{
  "session_id": "session-001",
  "query": "What is this document about?"
}
```

**Response:**
```json
{ "result": "This document is about..." }
```

Use the same `session_id` across requests to maintain a multi-turn conversation. Use a different `session_id` to start a fresh conversation.

## Architecture

```
MCPClient (helpers/mcp.py)
  └── Handles MCP transport: connect, list_tools, call_tool, embed_file

AIAgent (helpers/agent.py)
  └── Handles Mistral orchestration + per-session conversation history
  └── Uses MCPClient to call tools during the chat loop
```

`MCPClient` is connected on startup via FastAPI lifespan, then injected into `AIAgent`.

## Directory Structure

```
mcp-backend/
├── main.py                    # FastAPI app, lifespan, router registration
├── core/
│   └── config.py              # Pydantic settings (.env)
├── helpers/
│   ├── mcp.py                 # MCPClient — MCP connection and transport
│   └── agent.py               # AIAgent — Mistral + conversation history
├── endpoints/
│   └── v1/
│       └── client.py          # /embed and /chat endpoints
├── models/
│   └── response.py            # SingleResponse, ListResponse, PaginatedResponse
└── tests/
    ├── test.rest              # REST client test file
    └── Freelancer-BIR-Registration-2024.pdf
```
