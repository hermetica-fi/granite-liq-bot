FROM oven/bun:alpine
WORKDIR /app
COPY . .
WORKDIR /app/common
RUN bun install
WORKDIR /app
RUN bun install