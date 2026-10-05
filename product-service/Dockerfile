# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# Stage 2: Minimal runtime
FROM alpine:3.20

# Copy Node.js runtime from the builder image
COPY --from=builder /usr/local/bin/node /usr/local/bin/node
COPY --from=builder /usr/lib/libgcc* /usr/lib/
COPY --from=builder /usr/lib/libstdc* /usr/lib/

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package*.json ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser

EXPOSE 3001

CMD ["node", "src/server.js"]
