import axios from "axios";
import { ServiceError } from "../types";

/**
 * Interface for token price data
 */
export interface TokenPriceData {
  token: string;
  tokenSymbol: string;
  priceUsd: number;
  priceIdr: number;
  timestamp: number;
}

/**
 * Interface for fee calculation result
 */
export interface FeeCalculationResult {
  token: string;
  tokenSymbol: string;
  priceUsd: number;
  priceIdr: number;
  adminFeePercentage: number;
  adminFeeAmount: number;
  spreadFeePercentage: number;
  spreadFeeAmount: number;
  totalFeePercentage: number;
  totalFeeAmount: number;
  amountBeforeFees: number;
  amountAfterFees: number;
  exchangeRate: number;
  timestamp: number;
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
 * Service for calculating token prices, admin fees, and spread fees
 */
export class TokenFeeService {
  private readonly COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
  private IDR_TO_USD_RATE = 15500;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private priceCache: Map<string, { data: TokenPriceData; timestamp: number }>;
  private volatilityCache: Map<
    string,
    { result: VolatilityResult; timestamp: number }
  >;

  private readonly ADMIN_FEE_PERCENTAGE = 0.005;

  private readonly DEFAULT_SPREAD_FEE_PERCENTAGE = 0.002;

  constructor() {
    this.priceCache = new Map();
    this.volatilityCache = new Map();
    this.updateIdrUsdRate();

    setInterval(() => this.updateIdrUsdRate(), 60 * 60 * 1000);
  }

  /**
   * Get token price data in USD and IDR
   * @param token Token to get price for (eth, sol, etc.)
   * @returns Token price data
   */
  public async getTokenPrice(token: string): Promise<TokenPriceData> {
    const normalizedToken = this.normalizeTokenName(token);

    const cachedData = this.priceCache.get(normalizedToken);
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
      return cachedData.data;
    }

    try {
      const response = await axios.get(
        `${this.COINGECKO_API_URL}/simple/price`,
        {
          params: {
            ids: normalizedToken,
            vs_currencies: "usd",
            include_last_updated_at: true,
          },
          timeout: 10000,
        }
      );

      if (!response.data[normalizedToken]) {
        throw new ServiceError(`Token ${token} not found on CoinGecko`, 404);
      }

      const priceUsd = response.data[normalizedToken].usd;

      const priceIdr = priceUsd * this.IDR_TO_USD_RATE;

      const result: TokenPriceData = {
        token: normalizedToken,
        tokenSymbol: this.getTokenSymbol(normalizedToken),
        priceUsd,
        priceIdr,
        timestamp: Date.now(),
      };

      this.priceCache.set(normalizedToken, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error fetching price for ${token}:`, error);

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
        `Failed to get token price: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate fees for a token amount
   * @param token Token to calculate fees for (eth, sol, etc.)
   * @param amount Amount of the token
   * @param customSpreadFee Optional custom spread fee percentage (0.01 = 1%)
   * @returns Fee calculation result
   */
  public async calculateFees(
    token: string,
    amount: number,
    customSpreadFee?: number
  ): Promise<FeeCalculationResult> {
    if (amount <= 0) {
      throw new ServiceError("Amount must be greater than 0", 400);
    }

    try {
      const priceData = await this.getTokenPrice(token);

      let spreadFeePercentage = this.DEFAULT_SPREAD_FEE_PERCENTAGE;

      if (customSpreadFee !== undefined) {
        spreadFeePercentage = customSpreadFee;
      } else {
        try {
          const volatility = await this.calculateVolatility(token, 1);
          spreadFeePercentage = volatility.recommendedSpreadFee;
        } catch (error) {
          console.warn(
            `Using default spread fee due to error calculating volatility: ${
              (error as any).message
            }`
          );
        }
      }

      const adminFeeAmount = amount * this.ADMIN_FEE_PERCENTAGE;

      const spreadFeeAmount = amount * spreadFeePercentage;

      const totalFeeAmount = adminFeeAmount + spreadFeeAmount;
      const totalFeePercentage =
        this.ADMIN_FEE_PERCENTAGE + spreadFeePercentage;

      const amountAfterFees = amount + totalFeeAmount;

      const exchangeRate = priceData.priceIdr;

      return {
        token: priceData.token,
        tokenSymbol: priceData.tokenSymbol,
        priceUsd: priceData.priceUsd,
        priceIdr: priceData.priceIdr,
        adminFeePercentage: this.ADMIN_FEE_PERCENTAGE,
        adminFeeAmount,
        spreadFeePercentage,
        spreadFeeAmount,
        totalFeePercentage,
        totalFeeAmount,
        amountBeforeFees: amount,
        amountAfterFees,
        exchangeRate,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error calculating fees for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to calculate fees: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate IDRX amount from source token amount
   * @param token Source token (eth, sol, etc.)
   * @param amount Amount of source token
   * @param customSpreadFee Optional custom spread fee percentage
   * @returns IDRX amount and fee details
   */
  public async calculateIdrxAmount(
    token: string,
    amount: number,
    customSpreadFee?: number
  ): Promise<{
    idrxAmount: number;
    feeCalculation: FeeCalculationResult;
  }> {
    try {
      const feeCalculation = await this.calculateFees(
        token,
        amount,
        customSpreadFee
      );

      const idrxAmount =
        feeCalculation.amountAfterFees * feeCalculation.exchangeRate;

      return {
        idrxAmount,
        feeCalculation,
      };
    } catch (error) {
      console.error(`Error calculating IDRX amount for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to calculate IDRX amount: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate source token amount needed for a specific IDRX amount
   * @param token Source token (eth, sol, etc.)
   * @param idrxAmount Desired IDRX amount
   * @param customSpreadFee Optional custom spread fee percentage
   * @returns Source token amount and fee details
   */
  public async calculateSourceAmount(
    token: string,
    idrxAmount: number,
    customSpreadFee?: number
  ): Promise<{
    sourceAmount: number;
    feeCalculation: FeeCalculationResult;
  }> {
    if (idrxAmount <= 0) {
      throw new ServiceError("IDRX amount must be greater than 0", 400);
    }

    try {
      const priceData = await this.getTokenPrice(token);

      let spreadFeePercentage = this.DEFAULT_SPREAD_FEE_PERCENTAGE;

      if (customSpreadFee !== undefined) {
        spreadFeePercentage = customSpreadFee;
      } else {
        try {
          const volatility = await this.calculateVolatility(token, 1);
          spreadFeePercentage = volatility.recommendedSpreadFee;
        } catch (error) {
          console.warn(
            `Using default spread fee due to error calculating volatility: ${
              (error as any).message
            }`
          );
        }
      }

      const totalFeePercentage =
        this.ADMIN_FEE_PERCENTAGE + spreadFeePercentage;

      const exchangeRate = priceData.priceIdr;
      const sourceAmount =
        idrxAmount / (exchangeRate * (1 - totalFeePercentage));

      const feeCalculation = await this.calculateFees(
        token,
        sourceAmount,
        spreadFeePercentage
      );

      return {
        sourceAmount,
        feeCalculation,
      };
    } catch (error) {
      console.error(`Error calculating source amount for ${token}:`, error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to calculate source amount: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Update IDR to USD exchange rate
   * @returns Promise that resolves when update is complete
   */
  private async updateIdrUsdRate(): Promise<void> {
    try {
      const response = await axios.get(
        `${this.COINGECKO_API_URL}/simple/price`,
        {
          params: {
            ids: "tether",
            vs_currencies: "idr",
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.tether && response.data.tether.idr) {
        this.IDR_TO_USD_RATE = response.data.tether.idr;
        console.log(`Updated IDR to USD rate: ${this.IDR_TO_USD_RATE}`);
      }
    } catch (error) {
      console.error("Error updating IDR to USD rate:", error);
    }
  }

  /**
   * Calculate market volatility for a token
   * @param token Token to calculate volatility for
   * @param days Number of days of price history to analyze
   * @returns Volatility result with recommended spread fee
   */
  public async calculateVolatility(
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

      const volatility = this.calculateVolatilityFromPrices(history.prices);

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
      console.error(`Error calculating volatility for ${token}:`, error);

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
        `Failed to calculate volatility: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Calculate volatility from price data
   * @param prices Array of [timestamp, price] pairs
   * @returns Volatility as a decimal (e.g., 0.05 = 5%)
   */
  private calculateVolatilityFromPrices(prices: [number, number][]): number {
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
    const baseFee = 0.002;

    const volatilityComponent = volatility * 0.5;

    const maxFee = 0.02;

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
  ): Promise<{ prices: [number, number][] }> {
    try {
      const response = await axios.get(
        `${this.COINGECKO_API_URL}/coins/${token}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days: days.toString(),
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
   * Get token symbol from normalized name
   * @param normalizedToken Normalized token name
   * @returns Token symbol
   */
  private getTokenSymbol(normalizedToken: string): string {
    const symbolMap: Record<string, string> = {
      ethereum: "ETH",
      bitcoin: "BTC",
      solana: "SOL",
      "avalanche-2": "AVAX",
      binancecoin: "BNB",
      "matic-network": "MATIC",
      polkadot: "DOT",
      chainlink: "LINK",
      uniswap: "UNI",
      cardano: "ADA",
      dogecoin: "DOGE",
      "shiba-inu": "SHIB",
    };

    return symbolMap[normalizedToken] || normalizedToken.toUpperCase();
  }

  /**
   * Get supported tokens list
   * @returns Array of supported tokens with their symbols
   */
  public getSupportedTokens(): Array<{ id: string; symbol: string }> {
    return [
      { id: "ethereum", symbol: "ETH" },
      { id: "bitcoin", symbol: "BTC" },
      { id: "solana", symbol: "SOL" },
      { id: "avalanche-2", symbol: "AVAX" },
      { id: "binancecoin", symbol: "BNB" },
      { id: "matic-network", symbol: "MATIC" },
      { id: "polkadot", symbol: "DOT" },
      { id: "chainlink", symbol: "LINK" },
      { id: "uniswap", symbol: "UNI" },
      { id: "cardano", symbol: "ADA" },
      { id: "dogecoin", symbol: "DOGE" },
      { id: "shiba-inu", symbol: "SHIB" },
    ];
  }
}

export default new TokenFeeService();
