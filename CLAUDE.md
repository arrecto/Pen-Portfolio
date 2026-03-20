# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **Model Context Protocol (MCP)** implementation with three services:
- **`embeddings/`** — FastMCP HTTP server exposing document embedding and vector search tools (port 8001)
- **`mcp-backend/`** — FastAPI service that proxies requests to the embeddings MCP server via HTTP
- **`mcp-client/`** — Standalone CLI client that connects to MCP servers via stdio (subprocess)

All services use Python 3.14 and the **uv** package manager.

## Development Commands

```bash
# Install dependencies (run inside each service directory)
uv sync

# Run embeddings MCP server (port 8001)
cd embeddings && python embeddings.py

# Run backend API (port 8000)
cd mcp-backend && uvicorn main:app --reload

# Run standalone CLI client (stdio-based, connects to MCP server as subprocess)
cd mcp-client && python client.py <path_to_mcp_server_script>
# or the Mistral-integrated version:
cd mcp-client && python mcp_client.py
```

## Architecture

### Service Interaction

```
mcp-client ──(stdio subprocess)──► embeddings server
                                        │
mcp-backend ──(HTTP streamable)────────►│ port 8001
     │                                  ↓
     │                             ChromaDB (./chroma_db)
     │
     └──(REST API)──► Mistral AI
```

The **embeddings server** exposes three MCP tools:
- `embed_file(file_content: str, filename: str)` — base64-decode, chunk, store in ChromaDB
- `query_embeddings(query: str)` — semantic search, returns top 5 results
- `delete_data()` — clear all ChromaDB entries

The **mcp-backend** connects to the embeddings server on startup (FastAPI lifespan), converts MCP tools to Mistral function-calling format, and routes REST requests through `MCPClient` in `helpers/mcp.py`.

The **mcp-client** uses stdio transport — it spawns the target MCP server as a subprocess and communicates over stdin/stdout.

### Key Files

| File | Role |
|------|------|
| `embeddings/embeddings.py` | FastMCP server, all tool definitions |
| `embeddings/helpers/chromadb.py` | ChromaDB persistent client (`./chroma_db`) |
| `embeddings/helpers/file_parser.py` | PDF extraction (pdfminer-six), text chunking (1000 chars / 200 overlap) |
| `mcp-backend/helpers/mcp.py` | `MCPClient` — HTTP MCP connection + Mistral tool orchestration |
| `mcp-backend/endpoints/v1/client.py` | `POST /api/v1/client/embed` file upload endpoint |
| `mcp-backend/models/response.py` | `SingleResponse`, `ListResponse`, `PaginatedResponse` wrappers |
| `mcp-client/client.py` | Basic interactive CLI loop over stdio |
| `mcp-client/mcp_client.py` | CLI with full Mistral agent + multi-turn conversation |

## Environment Variables

**`mcp-backend/.env`**:
```
API_V1=/api/v1
MCP_HOST=localhost
MCP_PORT=8001
MISTRAL_API_KEY=...
```

**`mcp-client/.env`**:
```
MISTRAL_API_KEY=...
```

The embeddings service has no `.env` — ChromaDB storage path and server port are hardcoded in `embeddings.py`.

## Key Patterns

- **MCP transport**: embeddings runs `streamable-http`; mcp-client uses `stdio`. These are incompatible — the backend HTTP-connects to embeddings, while the CLI client stdio-connects to any server it spawns.
- **File embedding flow**: Files are base64-encoded before sending to `embed_file` tool, decoded server-side, then chunked and stored.
- **Mistral model**: Both backend and client use `mistral-large-latest` for tool-calling orchestration.
- **Package manager**: Use `uv sync` (not pip) to install dependencies — lock files (`uv.lock`) are committed per service.
