import axios from "axios";
import { ServiceError } from "../types";

/**
 * Interface for price history data from CoinGecko
 */
interface PriceHistoryData {
  prices: [number, number][];
}

/**
 * Interface for volatility calculation result
 */
export interface VolatilityResult {
  token: string;
  volatility: number;
  recommendedSpreadFee: number;
  timeframe: string;
  timestamp: number;
}

/**
 * Service for calculating spread fees based on market volatility
 */
export class SpreadFeeService {
  private readonly COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
  private readonly CACHE_TTL = 15 * 60 * 1000;
  private volatilityCache: Map<
    string,
    { result: VolatilityResult; timestamp: number }
  >;

  constructor() {
    this.volatilityCache = new Map();
  }

  /**
   * Calculate market volatility and recommended spread fee
   * @param token Token to calculate volatility for (eth, sol, etc.)
   * @param days Number of days of price history to analyze (1-30)
   * @returns Volatility result with recommended spread fee
   */
  public async calculateSpreadFee(
    token: string,
    days: number = 1
  ): Promise<VolatilityResult> {
    if (days < 1 || days > 30) {
      throw new ServiceError("Days parameter must be between 1 and 30", 400);
    }

    const normalizedToken = this.normalizeTokenName(token);

    const cacheKey = `${normalizedToken}-${days}`;

    const cachedResult = this.volatilityCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.CACHE_TTL) {
      return cachedResult.result;
    }

    try {
      const history = await this.fetchPriceHistory(normalizedToken, days);

      const volatility = this.calculateVolatility(history.prices);

      const recommendedSpreadFee =
        this.calculateRecommendedSpreadFee(volatility);

      const result: VolatilityResult = {
        token: normalizedToken,
        volatility,
        recommendedSpreadFee,
        timeframe: `${days} day${days > 1 ? "s" : ""}`,
        timestamp: Date.now(),
      };

      this.volatilityCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error calculating spread fee for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      if ((error as any).response && (error as any).response.status === 429) {
        throw new ServiceError(
          "CoinGecko API rate limit exceeded. Please try again later.",
          429
        );
      }

      throw new ServiceError(
        `Failed to calculate spread fee: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate volatility from price data
   * @param prices Array of [timestamp, price] pairs
   * @returns Volatility as a decimal (e.g., 0.05 = 5%)
   */
  private calculateVolatility(prices: [number, number][]): number {
    if (prices.length < 2) {
      return 0;
    }

    const priceValues = prices.map((pair) => pair[1]);

    const pctChanges: number[] = [];
    for (let i = 1; i < priceValues.length; i++) {
      const pctChange =
        (priceValues[i] - priceValues[i - 1]) / priceValues[i - 1];
      pctChanges.push(pctChange);
    }

    const mean =
      pctChanges.reduce((sum, val) => sum + val, 0) / pctChanges.length;
    const squaredDifferences = pctChanges.map((val) => Math.pow(val - mean, 2));
    const variance =
      squaredDifferences.reduce((sum, val) => sum + val, 0) / pctChanges.length;
    const stdDev = Math.sqrt(variance);

    const samplesPerDay = pctChanges.length;
    const annualizedVolatility = stdDev * Math.sqrt(365 * samplesPerDay);

    const dailyVolatility = annualizedVolatility / Math.sqrt(365);

    return dailyVolatility;
  }

  /**
   * Calculate recommended spread fee based on volatility
   * @param volatility Volatility as a decimal
   * @returns Recommended spread fee as a decimal (e.g., 0.01 = 1%)
   */
  private calculateRecommendedSpreadFee(volatility: number): number {
    const baseFee = 0.001;

    const volatilityComponent = volatility * 0.5;

    const maxFee = 0.03;

    const totalFee = baseFee + volatilityComponent;

    return Math.min(totalFee, maxFee);
  }

  /**
   * Fetch price history from CoinGecko
   * @param token Token ID in CoinGecko
   * @param days Number of days of history
   * @returns Price history data
   */
  private async fetchPriceHistory(
    token: string,
    days: number
  ): Promise<PriceHistoryData> {
    try {
      const response = await axios.get(
        `${this.COINGECKO_API_URL}/coins/${token}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days: days.toString(),
            interval: days <= 1 ? "minute" : "hour",
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      if ((error as any).response && (error as any).response.status === 404) {
        throw new ServiceError(`Token ${token} not found on CoinGecko`, 404);
      }

      throw error;
    }
  }

  /**
   * Normalize token name for CoinGecko API
   * @param token User input token name
   * @returns Normalized token name for CoinGecko
   */
  private normalizeTokenName(token: string): string {
    const normalized = token.toLowerCase().trim();

    const tokenMap: Record<string, string> = {
      eth: "ethereum",
      btc: "bitcoin",
      sol: "solana",
      avax: "avalanche-2",
      bnb: "binancecoin",
      matic: "matic-network",
      dot: "polkadot",
      link: "chainlink",
      uni: "uniswap",
      ada: "cardano",
      doge: "dogecoin",
      shib: "shiba-inu",
    };

    return tokenMap[normalized] || normalized;
  }

  /**
   * Get current market volatility for multiple tokens
   * @param tokens Array of token symbols
   * @param days Number of days of price history to analyze
   * @returns Record of token to volatility results
   */
  public async getMarketVolatility(
    tokens: string[] = ["ethereum", "solana"],
    days: number = 1
  ): Promise<Record<string, VolatilityResult>> {
    const result: Record<string, VolatilityResult> = {};

    for (const token of tokens) {
      try {
        result[token] = await this.calculateSpreadFee(token, days);
      } catch (error) {
        console.error(`Error getting volatility for ${token}:`, error);
      }
    }

    return result;
  }

  /**
   * Calculate average volatility across multiple tokens
   * @param tokens Array of token symbols
   * @param days Number of days of price history to analyze
   * @returns Average volatility and recommended spread fee
   */
  public async calculateAverageSpreadFee(
    tokens: string[] = ["ethereum", "solana"],
    days: number = 1
  ): Promise<{ averageVolatility: number; recommendedSpreadFee: number }> {
    const volatilityResults = await this.getMarketVolatility(tokens, days);

    const volatilityValues = Object.values(volatilityResults).map(
      (r) => r.volatility
    );

    if (volatilityValues.length === 0) {
      throw new ServiceError(
        "Failed to calculate volatility for any tokens",
        500
      );
    }

    const averageVolatility =
      volatilityValues.reduce((sum, val) => sum + val, 0) /
      volatilityValues.length;

    const recommendedSpreadFee =
      this.calculateRecommendedSpreadFee(averageVolatility);

    return {
      averageVolatility,
      recommendedSpreadFee,
    };
  }
}

export default new SpreadFeeService();
