FROM python:3.12-slim

WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Build this Dockerfile with the repository root as the Docker context. The
# API imports these sibling packages at runtime, so copying only backend/app
# results in ModuleNotFoundError: ml_engine on Render.
COPY backend /app/backend
COPY data_pipeline /app/data_pipeline
COPY ml_engine /app/ml_engine
COPY routing /app/routing
COPY data /app/data
ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
