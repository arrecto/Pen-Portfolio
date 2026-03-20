import json
from typing import AsyncGenerator

from core.config import settings
from helpers.mcp import MCPClient
from helpers.database import get_history, save_message


SYSTEM_PROMPT = """You are a helpful document assistant. Always search the knowledge base before answering.

Keep responses short and conversational — a few sentences is ideal unless the user asks for detail. \
Only use bullet points or structure when it genuinely helps. Stick to what the documents say; if the \
answer isn't there, say so briefly. Preserve key facts like names, numbers, and dates exactly as written."""


class AIAgent:
    def __init__(self, mcp_client: MCPClient):
        self.mcp = mcp_client

        if settings.ANTHROPIC_API_KEY:
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.provider = "anthropic"
            self.model = "claude-opus-4-6"
            print("AIAgent: using Anthropic (claude-opus-4-6)")
        elif settings.MISTRAL_API_KEY:
            from mistralai.client import Mistral
            self.client = Mistral(api_key=settings.MISTRAL_API_KEY)
            self.provider = "mistral"
            self.model = "mistral-large-latest"
            print("AIAgent: using Mistral (mistral-large-latest)")
        else:
            raise RuntimeError("No AI provider configured. Set ANTHROPIC_API_KEY or MISTRAL_API_KEY.")

    async def _get_mistral_tools(self) -> list:
        tools = await self.mcp.list_tools()
        return [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema,
                },
            }
            for tool in tools
        ]

    async def _get_anthropic_tools(self) -> list:
        tools = await self.mcp.list_tools()
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.inputSchema,
            }
            for tool in tools
        ]

    # ── Non-streaming ────────────────────────────────────────────────────────

    async def _chat_anthropic(self, query: str, session_id: str) -> str:
        await save_message(session_id, "user", query)
        history = await get_history(session_id)
        tools = await self._get_anthropic_tools()

        while True:
            response = await self.client.messages.create(
                model=self.model,
                system=SYSTEM_PROMPT,
                messages=history,
                tools=tools,
                max_tokens=1024,
            )
            if response.stop_reason == "tool_use":
                history.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = await self.mcp.call_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result.content),
                        })
                history.append({"role": "user", "content": tool_results})
            else:
                text = next(
                    (block.text for block in response.content if hasattr(block, "text")),
                    "No response."
                )
                await save_message(session_id, "assistant", text)
                return text

    async def _chat_mistral(self, query: str, session_id: str) -> str:
        await save_message(session_id, "user", query)
        history = await get_history(session_id)
        history.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
        tools = await self._get_mistral_tools()

        response = await self.client.chat.complete_async(
            model=self.model, messages=history, tools=tools, max_tokens=1024,
        )
        while response.choices[0].finish_reason == "tool_calls":
            choice = response.choices[0]
            history.append(choice.message)
            for tool_call in choice.message.tool_calls:
                args = json.loads(tool_call.function.arguments)
                result = await self.mcp.call_tool(tool_call.function.name, args)
                history.append({
                    "role": "tool",
                    "name": tool_call.function.name,
                    "content": str(result.content),
                    "tool_call_id": tool_call.id,
                })
            response = await self.client.chat.complete_async(
                model=self.model, messages=history, tools=tools, max_tokens=1024,
            )

        assistant_message = response.choices[0].message.content
        await save_message(session_id, "assistant", assistant_message)
        return assistant_message

    # ── Streaming ────────────────────────────────────────────────────────────

    async def _stream_chat_anthropic(self, query: str, session_id: str) -> AsyncGenerator[str, None]:
        await save_message(session_id, "user", query)
        history = await get_history(session_id)
        tools = await self._get_anthropic_tools()

        while True:
            full_text = ""
            async with self.client.messages.stream(
                model=self.model,
                system=SYSTEM_PROMPT,
                messages=history,
                tools=tools,
                max_tokens=1024,
            ) as stream:
                async for text in stream.text_stream:
                    full_text += text
                    yield text
                final = await stream.get_final_message()

            if final.stop_reason == "tool_use":
                history.append({"role": "assistant", "content": final.content})
                tool_results = []
                for block in final.content:
                    if block.type == "tool_use":
                        result = await self.mcp.call_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result.content),
                        })
                history.append({"role": "user", "content": tool_results})
            else:
                await save_message(session_id, "assistant", full_text)
                break

    async def _stream_chat_mistral(self, query: str, session_id: str) -> AsyncGenerator[str, None]:
        await save_message(session_id, "user", query)
        history = await get_history(session_id)
        history.insert(0, {"role": "system", "content": SYSTEM_PROMPT})
        tools = await self._get_mistral_tools()

        response = await self.client.chat.complete_async(
            model=self.model, messages=history, tools=tools, max_tokens=1024,
        )
        while response.choices[0].finish_reason == "tool_calls":
            choice = response.choices[0]
            history.append(choice.message)
            for tool_call in choice.message.tool_calls:
                args = json.loads(tool_call.function.arguments)
                result = await self.mcp.call_tool(tool_call.function.name, args)
                history.append({
                    "role": "tool",
                    "name": tool_call.function.name,
                    "content": str(result.content),
                    "tool_call_id": tool_call.id,
                })
            response = await self.client.chat.complete_async(
                model=self.model, messages=history, tools=tools, max_tokens=1024,
            )

        full_text = ""
        async with await self.client.chat.stream_async(
            model=self.model, messages=history, max_tokens=1024,
        ) as stream:
            async for chunk in stream:
                delta = chunk.data.choices[0].delta
                if delta.content:
                    full_text += delta.content
                    yield delta.content

        await save_message(session_id, "assistant", full_text)

    # ── Public API ───────────────────────────────────────────────────────────

    async def chat(self, query: str, session_id: str = "default") -> str:
        if self.provider == "anthropic":
            return await self._chat_anthropic(query, session_id)
        return await self._chat_mistral(query, session_id)

    async def stream_chat(self, query: str, session_id: str = "default") -> AsyncGenerator[str, None]:
        if self.provider == "anthropic":
            async for chunk in self._stream_chat_anthropic(query, session_id):
                yield chunk
        else:
            async for chunk in self._stream_chat_mistral(query, session_id):
                yield chunk
