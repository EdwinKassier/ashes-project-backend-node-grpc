import { PricePoint } from '../../domain/entities/price-point.js';
import { ExternalServiceError, SymbolNotFoundError } from '../../domain/errors/domain-errors.js';
import type { IExchangeClient } from '../../domain/repositories/exchange-client.interface.js';
import { settings } from '../../config/settings.js';
import { logger } from '../../config/logger.js';

interface KrakenOHLCResponse {
  error: string[];
  result: Record<string, [number, string, string, string, string, string, string, number][]>;
}

/**
 * Kraken exchange API client implementing IExchangeClient interface.
 * Handles all external API calls to the Kraken cryptocurrency exchange.
 */
export class KrakenClient implements IExchangeClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = settings.kraken.baseUrl;
    this.timeoutMs = settings.kraken.timeoutMs;
  }

  async symbolExists(symbol: string): Promise<boolean> {
    try {
      const response = await this.fetchOHLC(symbol);
      // If there are errors related to unknown pair, symbol doesn't exist
      const hasUnknownPairError = response.error.some(
        (err) => err.includes('Unknown asset pair') || err.includes('Invalid')
      );
      return !hasUnknownPairError && Object.keys(response.result).length > 0;
    } catch (error) {
      logger.warn({ symbol, error }, 'Error checking symbol existence');
      return false;
    }
  }

  async getHistoricalAverage(symbol: string): Promise<number> {
    const data = await this.fetchOHLC(symbol);
    const prices = this.extractPrices(data, symbol);

    if (prices.length === 0) {
      throw new SymbolNotFoundError(symbol);
    }

    // Take first 4 data points (first month of data)
    const historicalPrices = prices.slice(0, 4);
    const average = historicalPrices.reduce((sum, p) => sum + p, 0) / historicalPrices.length;

    logger.debug(
      { symbol, average, dataPoints: historicalPrices.length },
      'Calculated historical average'
    );
    return average;
  }

  async getCurrentAverage(symbol: string): Promise<number> {
    const data = await this.fetchOHLC(symbol);
    const prices = this.extractPrices(data, symbol);

    if (prices.length === 0) {
      throw new SymbolNotFoundError(symbol);
    }

    // Average of all available prices
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    logger.debug({ symbol, average, dataPoints: prices.length }, 'Calculated current average');
    return average;
  }

  async getPriceHistory(symbol: string): Promise<PricePoint[]> {
    const data = await this.fetchOHLC(symbol);
    const resultKey = this.findResultKey(data.result, symbol);

    if (!resultKey) {
      throw new SymbolNotFoundError(symbol);
    }

    const rawData = data.result[resultKey];
    if (!rawData) {
      throw new SymbolNotFoundError(symbol);
    }

    return rawData.map((point) => {
      const timestamp = new Date(point[0] * 1000);
      const closePrice = parseFloat(point[4]);
      return new PricePoint(timestamp, closePrice);
    });
  }

  private async fetchOHLC(symbol: string): Promise<KrakenOHLCResponse> {
    const url = `${this.baseUrl}/OHLC?pair=${symbol}USD&interval=21600&since=1548111600`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}: ${response.statusText}`);
      }

      const data = (await response.json()) as KrakenOHLCResponse;
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExternalServiceError('Kraken', new Error('Request timeout'));
      }
      throw new ExternalServiceError('Kraken', error instanceof Error ? error : undefined);
    }
  }

  private findResultKey(result: Record<string, unknown>, symbol: string): string | undefined {
    // Kraken uses various key formats like "ETHUSD", "XETHZUSD", etc.
    return Object.keys(result).find(
      (key) => key.includes(symbol) && key.includes('USD') && key !== 'last'
    );
  }

  private extractPrices(data: KrakenOHLCResponse, symbol: string): number[] {
    const resultKey = this.findResultKey(data.result, symbol);
    if (!resultKey) {
      return [];
    }

    const rawData = data.result[resultKey];
    if (!rawData) {
      return [];
    }

    return rawData.map((point) => parseFloat(point[4])); // Close price is at index 4
  }
}
