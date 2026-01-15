import type { PrismaClient } from '@prisma/client';
import { InvestmentResult } from '../../domain/entities/investment-result.js';
import type { IAnalysisRepository } from '../../domain/repositories/analysis-repository.interface.js';
import { logger } from '../../config/logger.js';

/**
 * Prisma-based implementation of IAnalysisRepository.
 * This adapter translates between domain entities and database models.
 */
export class AnalysisRepository implements IAnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCachedResult(symbol: string, investment: number): Promise<InvestmentResult | null> {
    const result = await this.prisma.analysisResult.findUnique({
      where: {
        symbol_investment: { symbol, investment },
      },
    });

    if (!result) {
      return null;
    }

    return new InvestmentResult(
      result.symbol,
      result.investment,
      result.numberOfCoins,
      result.profit,
      result.growthFactor,
      result.lambos,
      result.createdAt
    );
  }

  async saveResult(result: InvestmentResult): Promise<void> {
    await this.prisma.analysisResult.upsert({
      where: {
        symbol_investment: {
          symbol: result.symbol,
          investment: result.investment,
        },
      },
      update: {
        numberOfCoins: result.numberOfCoins,
        profit: result.profit,
        growthFactor: result.growthFactor,
        lambos: result.lambos,
      },
      create: {
        symbol: result.symbol,
        investment: result.investment,
        numberOfCoins: result.numberOfCoins,
        profit: result.profit,
        growthFactor: result.growthFactor,
        lambos: result.lambos,
      },
    });
    logger.debug({ symbol: result.symbol, investment: result.investment }, 'Saved analysis result');
  }

  async findOpeningAverage(symbol: string): Promise<number | null> {
    const result = await this.prisma.openingAverage.findUnique({
      where: { symbol },
    });
    return result?.average ?? null;
  }

  async saveOpeningAverage(symbol: string, average: number): Promise<void> {
    await this.prisma.openingAverage.upsert({
      where: { symbol },
      update: { average },
      create: { symbol, average },
    });
    logger.debug({ symbol, average }, 'Saved opening average');
  }

  async logQuery(symbol: string, investment: number): Promise<void> {
    await this.prisma.queryLog.create({
      data: { symbol, investment },
    });
    logger.debug({ symbol, investment }, 'Logged query');
  }
}
