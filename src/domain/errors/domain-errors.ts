/**
 * Base class for all domain errors.
 * Domain errors represent business rule violations.
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Thrown when a cryptocurrency symbol is not found on the exchange.
 */
export class SymbolNotFoundError extends DomainError {
    readonly code = 'SYMBOL_NOT_FOUND';

    constructor(symbol: string) {
        super(`Symbol '${symbol}' not found on exchange`);
    }
}

/**
 * Thrown when input validation fails.
 */
export class ValidationError extends DomainError {
    readonly code = 'VALIDATION_ERROR';

    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when an external service (API, database) fails.
 */
export class ExternalServiceError extends DomainError {
    readonly code = 'EXTERNAL_SERVICE_ERROR';

    constructor(
        service: string,
        cause?: Error
    ) {
        super(`External service '${service}' failed: ${cause?.message ?? 'Unknown error'}`);
        this.cause = cause;
    }
}

/**
 * Thrown when a cached result is not found.
 */
export class CacheNotFoundError extends DomainError {
    readonly code = 'CACHE_NOT_FOUND';

    constructor(key: string) {
        super(`Cache entry not found for key: ${key}`);
    }
}
