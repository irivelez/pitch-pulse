# Stage 1: Build frontend
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + built frontend
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app/ ./backend/app/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend/app
EXPOSE 8080

CMD ["python", "main.py"]
