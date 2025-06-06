# syntax=docker/dockerfile:1

# --- Builder for frontend ---
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Builder for backend ---
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

# --- Production image ---
FROM node:18-alpine

# Install build tools for native modules
RUN apk add --no-cache python3 make g++ sqlite-dev py3-setuptools

WORKDIR /app

# Copy backend dependencies and code
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/ ./

# Copy built frontend (Vite default is 'dist')
COPY --from=frontend-builder /app/frontend/dist ./public

# Rebuild better-sqlite3 for ARM64
RUN npm rebuild better-sqlite3 --build-from-source

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "server.js"]