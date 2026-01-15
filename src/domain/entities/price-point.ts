/**
 * PricePoint represents a single price at a point in time.
 * Used for historical price charting.
 */
export class PricePoint {
  constructor(
    public readonly timestamp: Date,
    public readonly price: number
  ) {}

  /**
   * Convert to a chart-friendly format.
   */
  toChartFormat(): { x: string; y: number } {
    return {
      x: this.timestamp.toISOString(),
      y: this.price,
    };
  }
}
