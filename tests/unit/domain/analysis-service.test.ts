import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisService } from '../../../src/domain/services/analysis-service.js';
import { InvestmentResult } from '../../../src/domain/entities/investment-result.js';
import { PricePoint } from '../../../src/domain/entities/price-point.js';
import { SymbolNotFoundError } from '../../../src/domain/errors/domain-errors.js';
import type { IAnalysisRepository } from '../../../src/domain/repositories/analysis-repository.interface.js';
import type { IExchangeClient } from '../../../src/domain/repositories/exchange-client.interface.js';

describe('AnalysisService', () => {
    let service: AnalysisService;
    let mockRepository: IAnalysisRepository;
    let mockExchangeClient: IExchangeClient;

    beforeEach(() => {
        mockRepository = {
            findCachedResult: vi.fn(),
            saveResult: vi.fn(),
            findOpeningAverage: vi.fn(),
            saveOpeningAverage: vi.fn(),
            logQuery: vi.fn(),
        };

        mockExchangeClient = {
            symbolExists: vi.fn(),
            getHistoricalAverage: vi.fn(),
            getCurrentAverage: vi.fn(),
            getPriceHistory: vi.fn(),
        };

        service = new AnalysisService(mockRepository, mockExchangeClient);
    });

    describe('analyze', () => {
        it('should analyze investment successfully with cached opening average', async () => {
            vi.mocked(mockExchangeClient.symbolExists).mockResolvedValue(true);
            vi.mocked(mockRepository.findOpeningAverage).mockResolvedValue(100);
            vi.mocked(mockExchangeClient.getCurrentAverage).mockResolvedValue(200);
            vi.mocked(mockRepository.saveResult).mockResolvedValue();
            vi.mocked(mockRepository.logQuery).mockResolvedValue();

            const result = await service.analyze('ETH', 1000);

            expect(result).toBeInstanceOf(InvestmentResult);
            expect(result.symbol).toBe('ETH');
            expect(result.profit).toBe(1000);
            expect(mockRepository.logQuery).toHaveBeenCalledWith('ETH', 1000);
            expect(mockExchangeClient.getHistoricalAverage).not.toHaveBeenCalled();
        });

        it('should fetch and cache opening average when not cached', async () => {
            vi.mocked(mockExchangeClient.symbolExists).mockResolvedValue(true);
            vi.mocked(mockRepository.findOpeningAverage).mockResolvedValue(null);
            vi.mocked(mockExchangeClient.getHistoricalAverage).mockResolvedValue(50);
            vi.mocked(mockExchangeClient.getCurrentAverage).mockResolvedValue(100);
            vi.mocked(mockRepository.saveOpeningAverage).mockResolvedValue();
            vi.mocked(mockRepository.saveResult).mockResolvedValue();
            vi.mocked(mockRepository.logQuery).mockResolvedValue();

            const result = await service.analyze('BTC', 500);

            expect(result.profit).toBe(500);
            expect(mockExchangeClient.getHistoricalAverage).toHaveBeenCalledWith('BTC');
            expect(mockRepository.saveOpeningAverage).toHaveBeenCalledWith('BTC', 50);
        });

        it('should throw SymbolNotFoundError when symbol does not exist', async () => {
            vi.mocked(mockExchangeClient.symbolExists).mockResolvedValue(false);
            vi.mocked(mockRepository.logQuery).mockResolvedValue();

            await expect(service.analyze('INVALID', 1000)).rejects.toThrow(SymbolNotFoundError);
        });

        it('should throw SymbolNotFoundError when result is invalid', async () => {
            vi.mocked(mockExchangeClient.symbolExists).mockResolvedValue(true);
            vi.mocked(mockRepository.findOpeningAverage).mockResolvedValue(0); // Division by zero
            vi.mocked(mockExchangeClient.getCurrentAverage).mockResolvedValue(100);
            vi.mocked(mockRepository.logQuery).mockResolvedValue();

            await expect(service.analyze('ETH', 1000)).rejects.toThrow(SymbolNotFoundError);
        });
    });

    describe('getPriceHistory', () => {
        it('should return price history for valid symbol', async () => {
            const mockPricePoints = [
                new PricePoint(new Date('2024-01-01'), 3000),
                new PricePoint(new Date('2024-01-02'), 3100),
            ];
            vi.mocked(mockExchangeClient.symbolExists).mockResolvedValue(true);
            vi.mocked(mockExchangeClient.getPriceHistory).mockResolvedValue(mockPricePoints);

            const result = await service.getPriceHistory('ETH');

            expect(result).toEqual(mockPricePoints);
            expect(mockExchangeClient.getPriceHistory).toHaveBeenCalledWith('ETH');
        });

        it('should throw SymbolNotFoundError for invalid symbol', async () => {
            vi.mocked(mockExchangeClient.symbolExists).mockResolvedValue(false);

            await expect(service.getPriceHistory('INVALID')).rejects.toThrow(SymbolNotFoundError);
        });
    });
});
