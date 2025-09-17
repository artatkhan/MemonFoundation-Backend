# Start with slim base instead of full image
FROM python:3.12-slim

# Set working directory
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose FastAPI port
EXPOSE 8000

ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Run FastAPI app from the app directory
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]