FROM python:3.12-slim

WORKDIR /app

# Build tools (needed to compile C-extension deps) + Playwright runtime libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3-dev \
    libxml2-dev libxslt1-dev \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0 \
    libgtk-3-0 libx11-xcb1 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev

# Pre-download the ONNX embedding model before Playwright to avoid disk pressure
RUN uv run python -c "from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2; ONNXMiniLM_L6_V2()"

# Install Playwright browser and run crawl4ai setup
RUN uv run crawl4ai-setup

COPY . .

EXPOSE 8001

CMD ["uv", "run", "python", "embeddings.py"]
