FROM oven/bun:alpine
RUN apk add --no-cache git
WORKDIR /app
COPY . .
RUN bun install