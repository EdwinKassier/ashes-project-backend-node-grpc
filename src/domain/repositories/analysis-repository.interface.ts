import type { InvestmentResult } from '../entities/investment-result.js';

/**
 * Repository interface for analysis data persistence.
 * This interface is defined in the domain layer and implemented in infrastructure.
 */
export interface IAnalysisRepository {
  /**
   * Find a cached investment result for a given symbol and investment amount.
   */
  findCachedResult(symbol: string, investment: number): Promise<InvestmentResult | null>;

  /**
   * Save an investment result to the database.
   */
  saveResult(result: InvestmentResult): Promise<void>;

  /**
   * Find the cached opening average price for a symbol.
   */
  findOpeningAverage(symbol: string): Promise<number | null>;

  /**
   * Save the opening average price for a symbol.
   */
  saveOpeningAverage(symbol: string, average: number): Promise<void>;

  /**
   * Log a query for analytics purposes.
   */
  logQuery(symbol: string, investment: number): Promise<void>;
}
