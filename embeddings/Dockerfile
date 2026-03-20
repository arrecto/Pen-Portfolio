FROM python:3.14-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

# Pre-download the ONNX embedding model at build time to avoid runtime OOM spikes
RUN uv run python -c "from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2; ONNXMiniLM_L6_V2()"

EXPOSE 8001

CMD ["uv", "run", "python", "embeddings.py"]
