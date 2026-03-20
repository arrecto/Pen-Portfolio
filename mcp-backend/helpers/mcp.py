from typing import Optional
from contextlib import AsyncExitStack
import base64

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from core.config import settings


class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self._connected = False

    async def connect(self):
        if self._connected:
            return

        url = f"http://{settings.MCP_HOST}:{settings.MCP_PORT}/mcp"
        transport = await self.exit_stack.enter_async_context(
            streamable_http_client(url)
        )
        read, write, _ = transport
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(read, write)
        )
        await self.session.initialize()
        self._connected = True

        response = await self.session.list_tools()
        print("\nConnected to MCP server with tools:", [t.name for t in response.tools])

    async def list_tools(self) -> list:
        response = await self.session.list_tools()
        return response.tools

    async def call_tool(self, name: str, args: dict):
        return await self.session.call_tool(name, args)

    async def embed_file(self, file_content: bytes, filename: str, doc_id: str) -> str:
        encoded = base64.b64encode(file_content).decode("utf-8")
        result = await self.session.call_tool(
            "embed_file", {"file_content": encoded, "filename": filename, "doc_id": doc_id}
        )
        return str(result.content)

    async def list_documents(self) -> str:
        result = await self.session.call_tool("list_documents", {})
        return result.content[0].text if result.content else "[]"

    async def delete_document(self, doc_id: str) -> str:
        result = await self.session.call_tool("delete_document", {"doc_id": doc_id})
        return str(result.content)

    async def delete_data(self) -> str:
        result = await self.session.call_tool("delete_data", {})
        return str(result.content)

    async def cleanup(self):
        await self.exit_stack.aclose()
        self._connected = False


mcp_client = MCPClient()
