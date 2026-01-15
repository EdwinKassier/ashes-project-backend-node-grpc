import { describe, it, expect } from 'vitest';
import {
    DomainError,
    SymbolNotFoundError,
    ValidationError,
    ExternalServiceError,
    CacheNotFoundError,
} from '../../../src/domain/errors/domain-errors.js';

describe('Domain Errors', () => {
    describe('SymbolNotFoundError', () => {
        it('should have correct code and message', () => {
            const error = new SymbolNotFoundError('XYZ');

            expect(error.code).toBe('SYMBOL_NOT_FOUND');
            expect(error.message).toBe("Symbol 'XYZ' not found on exchange");
            expect(error).toBeInstanceOf(DomainError);
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe('ValidationError', () => {
        it('should have correct code and message', () => {
            const error = new ValidationError('Invalid input');

            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toBe('Invalid input');
            expect(error).toBeInstanceOf(DomainError);
        });
    });

    describe('ExternalServiceError', () => {
        it('should include service name in message', () => {
            const error = new ExternalServiceError('Kraken');

            expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
            expect(error.message).toContain('Kraken');
            expect(error).toBeInstanceOf(DomainError);
        });

        it('should include cause error message', () => {
            const cause = new Error('Connection timeout');
            const error = new ExternalServiceError('Kraken', cause);

            expect(error.message).toContain('Connection timeout');
            expect(error.cause).toBe(cause);
        });
    });

    describe('CacheNotFoundError', () => {
        it('should have correct code and message', () => {
            const error = new CacheNotFoundError('ETH-1000');

            expect(error.code).toBe('CACHE_NOT_FOUND');
            expect(error.message).toContain('ETH-1000');
            expect(error).toBeInstanceOf(DomainError);
        });
    });
});
