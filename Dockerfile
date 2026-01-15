# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source and proto files
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy proto files (needed for proto-loader at runtime)
COPY --from=builder /app/proto ./proto

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set environment
ENV NODE_ENV=production

# Expose gRPC port
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const grpc = require('@grpc/grpc-js'); const client = new grpc.Client('localhost:50051', grpc.credentials.createInsecure()); client.waitForReady(Date.now() + 5000, (err) => process.exit(err ? 1 : 0));"

# Run application
CMD ["node", "dist/main.js"]