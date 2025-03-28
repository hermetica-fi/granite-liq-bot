FROM oven/bun:alpine
WORKDIR /app
COPY . .
RUN bun install