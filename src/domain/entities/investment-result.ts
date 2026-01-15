/**
 * InvestmentResult represents the outcome of a hypothetical cryptocurrency investment.
 * This is a pure domain entity with no external dependencies.
 */
export class InvestmentResult {
    constructor(
        public readonly symbol: string,
        public readonly investment: number,
        public readonly numberOfCoins: number,
        public readonly profit: number,
        public readonly growthFactor: number,
        public readonly lambos: number,
        public readonly generationDate: Date
    ) { }

    /**
     * Calculate investment result based on historical price data.
     *
     * @param symbol - Cryptocurrency symbol (e.g., "ETH", "BTC")
     * @param investment - Initial investment amount in USD
     * @param averageStartPrice - Average price at investment start
     * @param averageEndPrice - Average price at current time
     * @returns InvestmentResult with calculated metrics
     */
    static calculate(
        symbol: string,
        investment: number,
        averageStartPrice: number,
        averageEndPrice: number
    ): InvestmentResult {
        const numberOfCoins = investment / averageStartPrice;
        const currentValue = numberOfCoins * averageEndPrice;
        const profit = currentValue - investment;
        const growthFactor = profit / investment;
        const lambos = profit / 200000; // Assuming $200,000 per Lamborghini

        return new InvestmentResult(
            symbol,
            investment,
            numberOfCoins,
            parseFloat(profit.toFixed(2)),
            parseFloat(growthFactor.toFixed(4)),
            parseFloat(lambos.toFixed(4)),
            new Date()
        );
    }

    /**
   * Check if the investment result is valid (non-NaN and finite values).
   */
    isValid(): boolean {
        return (
            Number.isFinite(this.numberOfCoins) &&
            Number.isFinite(this.profit) &&
            Number.isFinite(this.growthFactor)
        );
    }
}
