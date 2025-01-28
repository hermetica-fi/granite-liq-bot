FROM oven/bun:alpine
WORKDIR /app
COPY . .
ARG VITE_API_BASE
RUN bun install
RUN bunx --bun vite build