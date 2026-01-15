<div align="center">

# Ashes Project gRPC Service

**Production-ready Node.js gRPC service with Clean Architecture and DDD**

[![Node.js 22+](https://img.shields.io/badge/node-22+-339933.svg?logo=node.js)](https://nodejs.org/)
[![TypeScript 5.7](https://img.shields.io/badge/typescript-5.7-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![gRPC](https://img.shields.io/badge/gRPC-Protocol-4285F4.svg)](https://grpc.io/)
[![Buf](https://img.shields.io/badge/Buf-Proto%20Management-00ADD8.svg)](https://buf.build/)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220.svg)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Overview

A high-performance gRPC service for cryptocurrency investment analysis, built with **TypeScript**, **Clean Architecture**, and **Domain-Driven Design** principles. The service calculates hypothetical returns for historical cryptocurrency investments using the Kraken exchange API.

### Key Features

- **TypeScript 5.7**: Strict type safety with modern ECMAScript modules
- **Clean Architecture**: Domain, Infrastructure, and Presentation layers with strict separation
- **gRPC with Health Checks**: Full gRPC Health Checking Protocol support
- **Buf for Protos**: Professional Protobuf management with linting and breaking change detection
- **PostgreSQL**: Production-ready database with Prisma ORM
- **Comprehensive Testing**: Vitest-based unit tests with 80%+ coverage targets
- **Modern CI/CD**: GitHub Actions with lint, test, build, and deploy stages

---

## Architecture

```
src/
├── main.ts                    # Entry point with DI setup
├── config/                    # Zod-validated configuration
│   ├── settings.ts           
│   └── logger.ts              # Pino structured logging
├── domain/                    # Pure business logic (no dependencies)
│   ├── entities/              # InvestmentResult, PricePoint
│   ├── services/              # AnalysisService
│   ├── repositories/          # Interface definitions
│   └── errors/                # Domain error types
├── infrastructure/            # External adapters
│   ├── database/              # Prisma repository
│   └── exchange/              # Kraken API client
└── grpc/                      # Presentation layer
    ├── server.ts              # Server lifecycle
    ├── handlers/              # RPC handlers
    └── interceptors/          # Logging middleware
```

### Layer Responsibilities

| Layer | Purpose | Dependencies |
|-------|---------|--------------|
| **Domain** | Business rules, entities, interfaces | None (pure) |
| **Infrastructure** | Database, external APIs | Domain interfaces |
| **gRPC** | Protocol handling, error mapping | Domain services |
| **Config** | Settings, logging | None |

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- [Buf CLI](https://buf.build/docs/installation) (optional, for proto management)

### Setup

1. **Clone and Install**

```bash
git clone <repo-url>
cd ashes-project-backend-node-grpc
pnpm install
```

2. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
```

3. **Start Infrastructure**

```bash
docker compose up -d postgres
```

4. **Setup Database**

```bash
pnpm db:generate
pnpm db:push
```

5. **Run Server**

```bash
pnpm dev
```

The server will start on `localhost:50051`.

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run production server |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint` | Lint code with ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Type check without emitting |
| `pnpm proto:gen` | Generate code from proto files |
| `pnpm proto:lint` | Lint proto files with Buf |

### Using Make

```bash
make install      # Install dependencies
make server       # Start development server
make test         # Run tests
make lint         # Lint code
make proto-gen    # Generate proto code
make docker-build # Build Docker image
```

---

## API

### CryptoAnalysisService

Defined in `proto/api/v1/analysis.proto`:

```protobuf
service CryptoAnalysisService {
  rpc Analyze(AnalyzeRequest) returns (AnalyzeResponse);
  rpc GetPriceHistory(PriceHistoryRequest) returns (PriceHistoryResponse);
}
```

### Testing with grpcurl

```bash
# List services
grpcurl -plaintext localhost:50051 list

# Health check
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# Analyze investment
grpcurl -plaintext -d '{"symbol": "ETH", "investment": 1000}' \
  localhost:50051 ashes.api.v1.CryptoAnalysisService/Analyze

# Get price history
grpcurl -plaintext -d '{"symbol": "BTC"}' \
  localhost:50051 ashes.api.v1.CryptoAnalysisService/GetPriceHistory
```

---

## Docker

### Build and Run

```bash
# Build image
docker build -t ashes-grpc-service .

# Run with environment variables
docker run -p 50051:50051 \
  -e DATABASE_URL="postgresql://..." \
  ashes-grpc-service
```

### Docker Compose (Full Stack)

```bash
# Start PostgreSQL and service
docker compose up -d

# View logs
docker compose logs -f grpc-service
```

---

## Testing

Tests are written with [Vitest](https://vitest.dev/) and organized by layer:

```
tests/
├── unit/
│   └── domain/           # Entity and service tests
├── integration/
│   └── grpc/             # Handler tests
└── fixtures/             # Test data
```

Run tests:

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

---

## Configuration

All configuration is loaded from environment variables and validated with Zod:

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `50051` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `KRAKEN_URL` | Kraken API base URL | `https://api.kraken.com/0/public` |
| `KRAKEN_TIMEOUT` | API request timeout (ms) | `10000` |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Environment | `development` |

---

## License

MIT