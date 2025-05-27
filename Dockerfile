# First stage: just for building the config
FROM oven/bun:alpine as builder
RUN apk add --no-cache git
WORKDIR /app

# Clone the config repository directly
RUN git clone https://github.com/GraniteProtocol/config config
WORKDIR /app/config
RUN bun install && bun run build

# Second stage: the liq bot
FROM oven/bun:alpine
RUN apk add --no-cache git
WORKDIR /app

# Copy application files
COPY . .

# Copy the pre-built config from the first stage
COPY --from=builder /app/config/dist ./src/config/dist

# Install dependencies
RUN bun install || true

# Start the application
CMD ["bun", "run", "start"]
