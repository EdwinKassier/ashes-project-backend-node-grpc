import type { PricePoint } from '../entities/price-point.js';

/**
 * Interface for cryptocurrency exchange client.
 * This interface is defined in the domain layer and implemented in infrastructure.
 */
export interface IExchangeClient {
  /**
   * Check if a cryptocurrency symbol exists on the exchange.
   */
  symbolExists(symbol: string): Promise<boolean>;

  /**
   * Get the historical average price for a symbol (at coin inception).
   */
  getHistoricalAverage(symbol: string): Promise<number>;

  /**
   * Get the current average price for a symbol.
   */
  getCurrentAverage(symbol: string): Promise<number>;

  /**
   * Get historical price data for charting.
   */
  getPriceHistory(symbol: string): Promise<PricePoint[]>;
}
