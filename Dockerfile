# ─── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Python backend ─────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install backend deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend into backend's static folder
COPY --from=frontend-build /app/frontend/dist ./static

# Expose port
EXPOSE 8080

# Serve static files from FastAPI + run with uvicorn
ENV PORT=8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
