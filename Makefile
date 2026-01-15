.PHONY: install proto-gen proto-lint server test lint format build clean

# Install dependencies
install:
	pnpm install

# Generate TypeScript from proto files
proto-gen:
	cd proto && buf generate

# Lint proto files
proto-lint:
	cd proto && buf lint

# Check for breaking changes in proto files
proto-breaking:
	cd proto && buf breaking --against '.git#branch=main'

# Run development server
server:
	pnpm dev

# Run production server
start:
	pnpm start

# Build TypeScript
build:
	pnpm build

# Run tests
test:
	pnpm test

# Run tests with coverage
test-coverage:
	pnpm test:coverage

# Lint code
lint:
	pnpm lint

# Format code
format:
	pnpm format

# Type check
typecheck:
	pnpm typecheck

# Database operations
db-generate:
	pnpm db:generate

db-migrate:
	pnpm db:migrate

db-push:
	pnpm db:push

# Clean build artifacts
clean:
	rm -rf dist node_modules

# Docker build
docker-build:
	docker build -t ashes-grpc-service .

# Docker run
docker-run:
	docker run -p 50051:50051 ashes-grpc-service
