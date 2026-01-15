import type { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';
import { AnalysisService } from '../../domain/services/analysis-service.js';
import { DomainError, SymbolNotFoundError, ValidationError } from '../../domain/errors/domain-errors.js';
import { logger } from '../../config/logger.js';

/**
 * Request type for Analyze RPC.
 */
interface AnalyzeRequest {
    symbol: string;
    investment: number;
}

/**
 * Response type for Analyze RPC.
 */
interface AnalyzeResponse {
    result: {
        symbol: string;
        investment: number;
        number_of_coins: number;
        profit: number;
        growth_factor: number;
        lambos: number;
        generation_date: string;
    };
}

/**
 * Request type for GetPriceHistory RPC.
 */
interface PriceHistoryRequest {
    symbol: string;
}

/**
 * Response type for GetPriceHistory RPC.
 */
interface PriceHistoryResponse {
    points: Array<{
        timestamp: string;
        price: number;
    }>;
}

/**
 * gRPC error type.
 */
interface GrpcError {
    code: number;
    message: string;
    name: string;
}

/**
 * gRPC handler for CryptoAnalysisService.
 * This class translates between gRPC protocol and domain layer.
 */
export class AnalysisHandler {
    constructor(private readonly analysisService: AnalysisService) { }

    /**
     * Handle Analyze RPC call.
     */
    analyze = async (
        call: ServerUnaryCall<AnalyzeRequest, AnalyzeResponse>,
        callback: sendUnaryData<AnalyzeResponse>
    ): Promise<void> => {
        const { symbol, investment } = call.request;

        logger.info({ symbol, investment }, 'Processing Analyze request');

        try {
            // Validate input
            if (!symbol || symbol.trim() === '') {
                throw new ValidationError('Symbol is required');
            }
            if (investment <= 0) {
                throw new ValidationError('Investment must be a positive number');
            }

            const result = await this.analysisService.analyze(symbol.toUpperCase(), investment);

            const response: AnalyzeResponse = {
                result: {
                    symbol: result.symbol,
                    investment: result.investment,
                    number_of_coins: result.numberOfCoins,
                    profit: result.profit,
                    growth_factor: result.growthFactor,
                    lambos: result.lambos,
                    generation_date: result.generationDate.toISOString(),
                },
            };

            logger.info({ symbol, investment, profit: result.profit }, 'Analyze request completed');
            callback(null, response);
        } catch (error) {
            const grpcError = this.mapErrorToGrpcStatus(error);
            logger.error({ symbol, investment, error: grpcError.message }, 'Analyze request failed');
            callback(grpcError, null);
        }
    };

    /**
     * Handle GetPriceHistory RPC call.
     */
    getPriceHistory = async (
        call: ServerUnaryCall<PriceHistoryRequest, PriceHistoryResponse>,
        callback: sendUnaryData<PriceHistoryResponse>
    ): Promise<void> => {
        const { symbol } = call.request;

        logger.info({ symbol }, 'Processing GetPriceHistory request');

        try {
            if (!symbol || symbol.trim() === '') {
                throw new ValidationError('Symbol is required');
            }

            const priceHistory = await this.analysisService.getPriceHistory(symbol.toUpperCase());

            const response: PriceHistoryResponse = {
                points: priceHistory.map((point) => ({
                    timestamp: point.timestamp.toISOString(),
                    price: point.price,
                })),
            };

            logger.info({ symbol, pointCount: priceHistory.length }, 'GetPriceHistory request completed');
            callback(null, response);
        } catch (error) {
            const grpcError = this.mapErrorToGrpcStatus(error);
            logger.error({ symbol, error: grpcError.message }, 'GetPriceHistory request failed');
            callback(grpcError, null);
        }
    };

    /**
     * Map domain errors to gRPC status codes.
     */
    private mapErrorToGrpcStatus(error: unknown): GrpcError {
        if (error instanceof SymbolNotFoundError) {
            return {
                code: status.NOT_FOUND,
                message: error.message,
                name: 'SymbolNotFoundError',
            };
        }

        if (error instanceof ValidationError) {
            return {
                code: status.INVALID_ARGUMENT,
                message: error.message,
                name: 'ValidationError',
            };
        }

        if (error instanceof DomainError) {
            return {
                code: status.INTERNAL,
                message: error.message,
                name: error.code,
            };
        }

        // Unknown error
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            code: status.INTERNAL,
            message,
            name: 'InternalError',
        };
    }
}
