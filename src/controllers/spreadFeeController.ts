import { Request, Response, NextFunction } from "express";
import spreadFeeService from "../services/spreadFeeService";

/**
 * Controller for spread fee calculation endpoints
 */
export class SpreadFeeController {
  /**
   * Calculate spread fee for a specific token
   */
  public async calculateSpreadFee(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token || "ethereum";
      const days = parseInt(req.query.days as string) || 1;

      const result = await spreadFeeService.calculateSpreadFee(token, days);

      res.status(200).json({
        success: true,
        ...result,
        volatilityPercentage: (result.volatility * 100).toFixed(2) + "%",
        spreadFeePercentage:
          (result.recommendedSpreadFee * 100).toFixed(2) + "%",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get volatility for multiple tokens
   */
  public async getMarketVolatility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let tokens: string[] = ["ethereum", "solana"];
      if (req.query.tokens) {
        tokens = (req.query.tokens as string).split(",").map((t) => t.trim());
      }

      const days = parseInt(req.query.days as string) || 1;

      const result = await spreadFeeService.getMarketVolatility(tokens, days);

      const formattedResult: Record<string, any> = {};

      for (const [token, data] of Object.entries(result)) {
        formattedResult[token] = {
          ...data,
          volatilityPercentage: (data.volatility * 100).toFixed(2) + "%",
          spreadFeePercentage:
            (data.recommendedSpreadFee * 100).toFixed(2) + "%",
        };
      }

      res.status(200).json({
        success: true,
        tokens: formattedResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate average volatility and recommended spread fee
   */
  public async calculateAverageSpreadFee(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let tokens: string[] = ["ethereum", "solana"];
      if (req.query.tokens) {
        tokens = (req.query.tokens as string).split(",").map((t) => t.trim());
      }

      const days = parseInt(req.query.days as string) || 1;

      const result = await spreadFeeService.calculateAverageSpreadFee(
        tokens,
        days
      );

      res.status(200).json({
        success: true,
        tokens: tokens,
        averageVolatility: result.averageVolatility,
        recommendedSpreadFee: result.recommendedSpreadFee,
        averageVolatilityPercentage:
          (result.averageVolatility * 100).toFixed(2) + "%",
        recommendedSpreadFeePercentage:
          (result.recommendedSpreadFee * 100).toFixed(2) + "%",
        timeframe: `${days} day${days > 1 ? "s" : ""}`,
        timestamp: Date.now(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SpreadFeeController();
