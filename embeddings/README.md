# Embeddings MCP Server

A FastMCP HTTP server that exposes document embedding and vector search as MCP tools. Files are chunked and stored in ChromaDB, enabling semantic search over uploaded documents.

## Stack

- **FastMCP** — MCP server with streamable-http transport
- **ChromaDB** — Local persistent vector store (`./chroma_db`)
- **pdfminer-six** — PDF text extraction
- **langchain-text-splitters** — Recursive character chunking (1000 chars / 200 overlap)

## Setup

```bash
# Install uv if not already installed
pip install uv

# Install dependencies
uv sync
```

## Running

```bash
python embeddings.py
```

Server starts on `http://127.0.0.1:8001/mcp`.

## Tools

| Tool | Description |
|------|-------------|
| `embed_file(file_content, filename)` | Accepts base64-encoded file content, chunks it, and stores in ChromaDB |
| `query_embeddings(query)` | Semantic search, returns top 5 matching chunks |
| `delete_data()` | Clears all documents from ChromaDB |

## Directory Structure

```
embeddings/
├── embeddings.py          # FastMCP server entry point
├── helpers/
│   ├── chromadb.py        # ChromaDB persistent client setup
│   └── file_parser.py     # PDF extraction and text chunking
├── chroma_db/             # Auto-generated vector store (gitignored)
└── pyproject.toml
```

## Notes

- ChromaDB data persists in `./chroma_db` across restarts
- Only PDF files are currently supported for parsing
- The embeddings server must be running before starting `mcp-backend`
