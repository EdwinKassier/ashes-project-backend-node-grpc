import { describe, it, expect } from 'vitest';
import { InvestmentResult } from '../../../src/domain/entities/investment-result.js';

describe('InvestmentResult', () => {
    describe('calculate', () => {
        it('should calculate profit correctly for positive growth', () => {
            const result = InvestmentResult.calculate('ETH', 1000, 100, 200);

            expect(result.symbol).toBe('ETH');
            expect(result.investment).toBe(1000);
            expect(result.numberOfCoins).toBe(10);
            expect(result.profit).toBe(1000);
            expect(result.growthFactor).toBe(1);
        });

        it('should calculate loss correctly for negative growth', () => {
            const result = InvestmentResult.calculate('BTC', 1000, 200, 100);

            expect(result.symbol).toBe('BTC');
            expect(result.investment).toBe(1000);
            expect(result.numberOfCoins).toBe(5);
            expect(result.profit).toBe(-500);
            expect(result.growthFactor).toBe(-0.5);
        });

        it('should calculate lambos based on profit', () => {
            // Profit of $400,000 should equal 2 lambos
            const result = InvestmentResult.calculate('ETH', 10000, 100, 5000);

            expect(result.profit).toBe(490000);
            expect(result.lambos).toBeCloseTo(2.45, 1);
        });

        it('should set generation date to current time', () => {
            const before = new Date();
            const result = InvestmentResult.calculate('ETH', 1000, 100, 200);
            const after = new Date();

            expect(result.generationDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(result.generationDate.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('isValid', () => {
        it('should return true for valid result', () => {
            const result = InvestmentResult.calculate('ETH', 1000, 100, 200);
            expect(result.isValid()).toBe(true);
        });

        it('should return false when numberOfCoins is NaN', () => {
            const result = new InvestmentResult(
                'ETH',
                1000,
                NaN,
                100,
                0.1,
                0.0005,
                new Date()
            );
            expect(result.isValid()).toBe(false);
        });

        it('should return false when profit is NaN', () => {
            const result = new InvestmentResult(
                'ETH',
                1000,
                10,
                NaN,
                0.1,
                0.0005,
                new Date()
            );
            expect(result.isValid()).toBe(false);
        });

        it('should return false when growthFactor is NaN', () => {
            const result = new InvestmentResult(
                'ETH',
                1000,
                10,
                100,
                NaN,
                0.0005,
                new Date()
            );
            expect(result.isValid()).toBe(false);
        });
    });
});
