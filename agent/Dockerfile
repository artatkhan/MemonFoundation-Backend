# agent/Dockerfile
FROM python:3.11-slim

WORKDIR /usr/src/app

# Install dependencies (expects agent/requirements.txt)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY . .

# Expose the FastAPI port (default 8000)
EXPOSE 8000

# Set environment variables
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]