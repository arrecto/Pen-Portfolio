import uuid
import base64
import tempfile
import os
import json
from mcp.server.fastmcp import FastMCP

from helpers.chromadb import client
from helpers.file_parser import chunk_file

collection = client.get_or_create_collection("documents")

mcp = FastMCP("embeddings", port=8001)


@mcp.tool()
def embed_file(file_content: str, filename: str, doc_id: str) -> str:
    """Embed a file from base64-encoded content"""
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, filename)

    try:
        with open(temp_path, "wb") as f:
            f.write(base64.b64decode(file_content))

        chunks = chunk_file(temp_path)
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [{"source": filename, "doc_id": doc_id} for _ in chunks]
        collection.add(ids=ids, documents=chunks, metadatas=metadatas)
        return f"File '{filename}' embedded successfully"
    finally:
        os.remove(temp_path)
        os.rmdir(temp_dir)


@mcp.tool()
def query_embeddings(query: str) -> str:
    """Query the embeddings and return the results."""
    results = collection.query(query_texts=[query], n_results=5)
    documents = results.get("documents", [[]])[0]
    return json.dumps(documents)


@mcp.tool()
def list_documents() -> str:
    """List all embedded documents as [{doc_id, filename}] pairs."""
    result = collection.get(include=["metadatas"])
    metadatas = result.get("metadatas") or []
    seen = {}
    for m in metadatas:
        if m and "doc_id" in m and "source" in m:
            seen[m["doc_id"]] = m["source"]
    docs = [{"doc_id": doc_id, "filename": filename} for doc_id, filename in seen.items()]
    return json.dumps(docs)


@mcp.tool()
def delete_document(doc_id: str) -> str:
    """Delete all chunks for a specific document by doc_id."""
    try:
        collection.delete(where={"doc_id": doc_id})
        return f"Document '{doc_id}' deleted successfully."
    except Exception as e:
        return f"Error deleting document: {str(e)}"


@mcp.tool()
def delete_data():
    """Delete all embedded data."""
    global collection
    try:
        client.delete_collection("documents")
        collection = client.get_or_create_collection("documents")
        return "Contents successfully deleted."
    except:
        return "Error occured, failed to delete contents"


def main():
    mcp.run(transport="streamable-http", host="0.0.0.0")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "embed":
            print(embed_file(sys.argv[2], os.path.basename(sys.argv[2])))
        elif command == "query":
            print(query_embeddings(" ".join(sys.argv[2:])))
        elif command == "delete":
            print(delete_data())
        elif command == "list":
            print(list_documents())
        else:
            print("Invalid command.")
    else:
        main()
