# PEN — AI Document Assistant

An intelligent document assistant built on the **Model Context Protocol (MCP)**. Upload PDF documents and chat with their contents using semantic search and streaming AI responses.

Built as a portfolio project demonstrating full-stack AI application development — from vector embeddings to real-time streaming UI.

---

## Architecture

```
┌─────────────────┐     REST/SSE      ┌──────────────────┐     HTTP/MCP      ┌─────────────────────┐
│   Next.js 16    │ ────────────────► │   FastAPI 0.135  │ ────────────────► │   FastMCP Server    │
│   (Port 3000)   │                   │   (Port 8000)    │                   │   (Port 8001)       │
│                 │                   │                  │                   │                     │
│  App Router     │                   │  MCP Client      │                   │  Tool Definitions   │
│  Tailwind v4    │                   │  AI Agent        │                   │  ChromaDB Client    │
│  Shadcn/ui      │                   │  SQLite History  │                   │  PDF Parser         │
└─────────────────┘                   └──────────────────┘                   └─────────────────────┘
                                               │                                        │
                                               ▼                                        ▼
                                        ┌──────────────┐                      ┌─────────────────┐
                                        │  Anthropic   │                      │    ChromaDB     │
                                        │  or Mistral  │                      │  (Vector Store) │
                                        └──────────────┘                      └─────────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │    SQLite    │
                                        │  (Sessions & │
                                        │   Messages)  │
                                        └──────────────┘
```

### Services

| Service | Tech | Port | Role |
|---|---|---|---|
| `mcp-frontend` | Next.js 16, TypeScript, Tailwind v4 | 3000 | Chat UI, document upload, session management |
| `mcp-backend` | FastAPI, Python 3.14 | 8000 | API proxy, AI agent orchestration, conversation history |
| `embeddings` | FastMCP, ChromaDB, Python 3.14 | 8001 | MCP server exposing embedding and search tools |

---

## How It Works

### Document Upload Flow
1. User uploads a PDF via the frontend
2. Backend base64-encodes the file and calls the MCP `embed_file` tool
3. Embeddings server parses the PDF, splits text into chunks (1000 chars / 200 overlap), and stores them in ChromaDB with a UUID `doc_id`

### Chat Flow
1. User sends a message — frontend opens an SSE connection to the backend
2. Backend retrieves conversation history from SQLite and sends to the LLM
3. LLM decides to call the `query_embeddings` MCP tool, which performs semantic search over ChromaDB
4. Top 5 relevant chunks are returned and used as context
5. LLM streams its response back through the backend to the frontend in real time

---

## Tech Stack

### Backend (`mcp-backend`)
- **FastAPI** — async Python web framework
- **aiosqlite** — async SQLite for conversation persistence
- **Anthropic SDK** — Claude API with tool-calling support
- **Mistral SDK** — Mistral Large as an alternative LLM provider
- **MCP SDK** — HTTP client connecting to the embeddings service

### Embeddings (`embeddings`)
- **FastMCP** — MCP server with streamable-HTTP transport
- **ChromaDB** — persistent local vector database
- **pdfminer-six** — PDF text extraction
- **langchain-text-splitters** — `RecursiveCharacterTextSplitter` for chunking

### Frontend (`mcp-frontend`)
- **Next.js 16** with App Router
- **Tailwind CSS v4** — CSS-based design tokens via `@theme inline`
- **Shadcn/ui** — accessible component library (Radix UI)
- **React Context API** — `HttpProvider`, `ChatContext`, `ToastContext`
- **Server-Sent Events** — real-time streaming via `fetch` + `ReadableStream`

---

## Key Features

- **Streaming responses** — LLM output streams token-by-token via SSE
- **Multi-document support** — upload multiple PDFs; queries search across all of them
- **Conversation history** — multi-turn chat persisted in SQLite per session
- **Dual LLM provider** — auto-selects Anthropic Claude or Mistral depending on which API key is configured
- **Document management** — upload, list, and delete documents tracked by UUID
- **Session management** — multiple named chat sessions with local persistence

---

## Project Structure

```
MCP-Project/
├── embeddings/                  # FastMCP server
│   ├── embeddings.py            # MCP tool definitions
│   └── helpers/
│       ├── chromadb.py          # ChromaDB client setup
│       └── file_parser.py       # PDF parsing and chunking
│
├── mcp-backend/                 # FastAPI backend
│   ├── main.py                  # App init, CORS, lifespan
│   ├── core/config.py           # Pydantic settings
│   ├── helpers/
│   │   ├── agent.py             # AI agent (Anthropic/Mistral + tool-calling)
│   │   ├── mcp.py               # MCPClient (HTTP connection to embeddings)
│   │   └── database.py          # SQLite session and message storage
│   └── endpoints/v1/client.py   # REST routes
│
├── mcp-frontend/                # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx                        # Landing / upload page
│       │   └── chat/
│       │       ├── page.tsx                    # Chat interface
│       │       └── manage-documents/page.tsx   # Document management
│       ├── components/
│       │   ├── MainChat.tsx     # Chat message rendering
│       │   └── AppSidebar.tsx   # Sidebar navigation
│       └── contexts/
│           ├── HttpProvider.tsx  # Fetch-based HTTP client
│           ├── ChatContext.tsx   # Session state + SSE streaming
│           └── ToastContext.tsx  # Notification system
│
└── docker-compose.yml           # Multi-service orchestration
```

---

## Getting Started

### Prerequisites
- Python 3.14+, [`uv`](https://github.com/astral-sh/uv)
- Node.js 20+, npm
- Anthropic or Mistral API key

### Local Development

**1. Embeddings server**
```bash
cd embeddings
uv sync
python embeddings.py
```

**2. Backend**
```bash
cd mcp-backend
cp .env.example .env   # add your API key
uv sync
uvicorn main:app --reload
```

**3. Frontend**
```bash
cd mcp-frontend
npm install
npm run dev
```

### Docker (Production)

```bash
cp .env.example .env   # set NEXT_PUBLIC_API_URL and API keys
docker-compose up -d
```

Services will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Embeddings MCP: `http://localhost:8001`

---

## Environment Variables

**`mcp-backend/.env`**
```env
API_V1=/api/v1
MCP_HOST=localhost          # Use "embeddings" in Docker
MCP_PORT=8001
ANTHROPIC_API_KEY=...       # Use one or the other
MISTRAL_API_KEY=...
SQLITE_DB_PATH=./pen.db     # Use /data/pen.db in Docker
```

**`mcp-frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## MCP Tools Exposed

| Tool | Arguments | Description |
|---|---|---|
| `embed_file` | `file_content`, `filename`, `doc_id` | Decode, chunk, and store a document |
| `query_embeddings` | `query` | Semantic search — returns top 5 matching chunks |
| `list_documents` | — | Returns all documents as `[{doc_id, filename}]` |
| `delete_document` | `doc_id` | Delete all chunks for a document |
| `delete_data` | — | Clear the entire vector store |
