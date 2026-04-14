FROM python:3.13.12-slim

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency files first (better caching, less pain)
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN uv sync --frozen

# Create logs directory
RUN mkdir -p /app/logs

# Copy the rest of the app
COPY . .

# Start the app like a grown-up container
ENTRYPOINT ["uv", "run"]
CMD ["gunicorn", "main:application", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:10000", "-w", "4", "--timeout", "600", "--forwarded-allow-ips", "*"]