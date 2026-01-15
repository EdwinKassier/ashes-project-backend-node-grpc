import { InvestmentResult } from '../entities/investment-result.js';
import type { PricePoint } from '../entities/price-point.js';
import { SymbolNotFoundError } from '../errors/domain-errors.js';
import type { IAnalysisRepository } from '../repositories/analysis-repository.interface.js';
import type { IExchangeClient } from '../repositories/exchange-client.interface.js';

/**
 * Domain service for cryptocurrency investment analysis.
 * This service contains pure business logic with no infrastructure dependencies.
 * Dependencies are injected via constructor following Dependency Inversion Principle.
 */
export class AnalysisService {
  constructor(
    private readonly repository: IAnalysisRepository,
    private readonly exchangeClient: IExchangeClient
  ) {}

  /**
   * Analyze a hypothetical historical investment in a cryptocurrency.
   *
   * @param symbol - Cryptocurrency symbol (e.g., "ETH", "BTC")
   * @param investment - Investment amount in USD
   * @returns InvestmentResult with calculated profit/loss metrics
   * @throws SymbolNotFoundError if the symbol doesn't exist on the exchange
   */
  async analyze(symbol: string, investment: number): Promise<InvestmentResult> {
    // Log the query for analytics
    await this.repository.logQuery(symbol, investment);

    // Validate symbol exists on exchange
    const exists = await this.exchangeClient.symbolExists(symbol);
    if (!exists) {
      throw new SymbolNotFoundError(symbol);
    }

    // Get opening average (use cached value if available)
    let averageStartPrice = await this.repository.findOpeningAverage(symbol);
    if (averageStartPrice === null) {
      averageStartPrice = await this.exchangeClient.getHistoricalAverage(symbol);
      await this.repository.saveOpeningAverage(symbol, averageStartPrice);
    }

    // Get current average price
    const averageEndPrice = await this.exchangeClient.getCurrentAverage(symbol);

    // Calculate investment result
    const result = InvestmentResult.calculate(
      symbol,
      investment,
      averageStartPrice,
      averageEndPrice
    );

    // Validate result
    if (!result.isValid()) {
      throw new SymbolNotFoundError(symbol);
    }

    // Persist result
    await this.repository.saveResult(result);

    return result;
  }

  /**
   * Get historical price data for charting.
   *
   * @param symbol - Cryptocurrency symbol
   * @returns Array of price points over time
   * @throws SymbolNotFoundError if the symbol doesn't exist
   */
  async getPriceHistory(symbol: string): Promise<PricePoint[]> {
    // Validate symbol exists
    const exists = await this.exchangeClient.symbolExists(symbol);
    if (!exists) {
      throw new SymbolNotFoundError(symbol);
    }

    return this.exchangeClient.getPriceHistory(symbol);
  }
}
