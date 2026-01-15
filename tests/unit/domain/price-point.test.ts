import { describe, it, expect } from 'vitest';
import { PricePoint } from '../../../src/domain/entities/price-point.js';

describe('PricePoint', () => {
    describe('constructor', () => {
        it('should create a price point with timestamp and price', () => {
            const timestamp = new Date('2024-01-15T12:00:00Z');
            const price = 3000.5;

            const pricePoint = new PricePoint(timestamp, price);

            expect(pricePoint.timestamp).toEqual(timestamp);
            expect(pricePoint.price).toBe(price);
        });
    });

    describe('toChartFormat', () => {
        it('should return chart-friendly format with ISO timestamp', () => {
            const timestamp = new Date('2024-01-15T12:00:00Z');
            const price = 3000.5;
            const pricePoint = new PricePoint(timestamp, price);

            const chartData = pricePoint.toChartFormat();

            expect(chartData).toEqual({
                x: '2024-01-15T12:00:00.000Z',
                y: 3000.5,
            });
        });
    });
});
