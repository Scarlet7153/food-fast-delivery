# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with network-resilient options
# Use --omit=dev (modern replacement for --only=production), disable audit, and prefer offline
# Retry a few times to mitigate transient network/ECONNRESET errors during docker builds
RUN sh -c '\
  set -eux; \
  MAX_TRIES=5; \
  for i in $(seq 1 "$MAX_TRIES"); do \
    npm ci --omit=dev --no-audit --prefer-offline && break || { \
      echo "npm ci failed (attempt=$i/$MAX_TRIES). Retrying in 3s..."; \
      sleep 3; \
    }; \
  done; \
  '

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/app.js"]
