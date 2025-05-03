import { Request, Response, NextFunction } from "express";
import tokenFeeService from "../services/tokenFeeService";
import { formatCurrency } from "../utils/general";

/**
 * Controller for token fee calculation endpoints
 */
export class TokenFeeController {
  /**
   * Get token price data
   */
  public async getTokenPrice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token || "ethereum";

      const result = await tokenFeeService.getTokenPrice(token);

      res.status(200).json({
        success: true,
        ...result,
        priceIdrFormatted: formatCurrency(result.priceIdr, "IDR"),
        priceUsdFormatted: formatCurrency(result.priceUsd, "USD"),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate fees for a token amount
   */
  public async calculateFees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token = "ethereum", amount, customSpreadFee } = req.query;

      const tokenStr = token as string;
      const amountNum = parseFloat(amount as string);
      let spreadFee: number | undefined = undefined;

      if (customSpreadFee) {
        spreadFee = parseFloat(customSpreadFee as string);
      }

      const result = await tokenFeeService.calculateFees(
        tokenStr,
        amountNum,
        spreadFee
      );

      const formattedResult = {
        ...result,
        priceIdrFormatted: formatCurrency(result.priceIdr, "IDR"),
        priceUsdFormatted: formatCurrency(result.priceUsd, "USD"),
        adminFeePercentageFormatted: `${(
          result.adminFeePercentage * 100
        ).toFixed(2)}%`,
        spreadFeePercentageFormatted: `${(
          result.spreadFeePercentage * 100
        ).toFixed(2)}%`,
        totalFeePercentageFormatted: `${(
          result.totalFeePercentage * 100
        ).toFixed(2)}%`,
      };

      res.status(200).json({
        success: true,
        result: formattedResult,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate IDRX amount from source token
   */
  public async calculateIdrxAmount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token = "ethereum", amount, customSpreadFee } = req.query;

      const tokenStr = token as string;
      const amountNum = parseFloat(amount as string);
      let spreadFee: number | undefined = undefined;

      if (customSpreadFee) {
        spreadFee = parseFloat(customSpreadFee as string);
      }

      const result = await tokenFeeService.calculateIdrxAmount(
        tokenStr,
        amountNum,
        spreadFee
      );

      const response = {
        success: true,
        token: tokenStr,
        sourceAmount: amountNum,
        idrxAmount: result.idrxAmount,
        idrxAmountFormatted: formatCurrency(result.idrxAmount, "IDR"),
        fees: {
          ...result.feeCalculation,
          adminFeePercentageFormatted: `${(
            result.feeCalculation.adminFeePercentage * 100
          ).toFixed(2)}%`,
          spreadFeePercentageFormatted: `${(
            result.feeCalculation.spreadFeePercentage * 100
          ).toFixed(2)}%`,
          totalFeePercentageFormatted: `${(
            result.feeCalculation.totalFeePercentage * 100
          ).toFixed(2)}%`,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate source token amount needed for a desired IDRX amount
   */
  public async calculateSourceAmount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token = "ethereum", idrxAmount, customSpreadFee } = req.query;

      const tokenStr = token as string;
      const idrxAmountNum = parseFloat(idrxAmount as string);
      let spreadFee: number | undefined = undefined;

      if (customSpreadFee) {
        spreadFee = parseFloat(customSpreadFee as string);
      }

      const result = await tokenFeeService.calculateSourceAmount(
        tokenStr,
        idrxAmountNum,
        spreadFee
      );

      const response = {
        success: true,
        token: tokenStr,
        sourceAmount: result.sourceAmount,
        sourceAmountFormatted: `${result.sourceAmount.toFixed(8)} ${
          result.feeCalculation.tokenSymbol
        }`,
        idrxAmount: idrxAmountNum,
        idrxAmountFormatted: formatCurrency(idrxAmountNum, "IDR"),
        fees: {
          ...result.feeCalculation,
          adminFeePercentageFormatted: `${(
            result.feeCalculation.adminFeePercentage * 100
          ).toFixed(2)}%`,
          spreadFeePercentageFormatted: `${(
            result.feeCalculation.spreadFeePercentage * 100
          ).toFixed(2)}%`,
          totalFeePercentageFormatted: `${(
            result.feeCalculation.totalFeePercentage * 100
          ).toFixed(2)}%`,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate volatility and recommended spread fee
   */
  public async calculateVolatility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.params.token || "ethereum";
      const days = parseInt(req.query.days as string) || 1;

      const result = await tokenFeeService.calculateVolatility(token, days);

      res.status(200).json({
        success: true,
        ...result,
        volatilityPercentage: `${(result.volatility * 100).toFixed(2)}%`,
        recommendedSpreadFeePercentage: `${(
          result.recommendedSpreadFee * 100
        ).toFixed(2)}%`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of supported tokens
   */
  public getSupportedTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tokens = tokenFeeService.getSupportedTokens();

      res.status(200).json({
        success: true,
        tokens,
      });
    } catch (error) {
      next(error);
    }

    return Promise.resolve();
  }
}

export default new TokenFeeController();
