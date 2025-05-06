import { Request, Response, NextFunction } from "express";
import reserveLimitService from "../services/reserveLimitService";

/**
 * Controller for reserve limit endpoints
 */
export class ReserveLimitController {
  constructor() {
    this.getHealthDescription = this.getHealthDescription.bind(this);
    this.calculateTransferLimits = this.calculateTransferLimits.bind(this);
    this.updateTransferLimits = this.updateTransferLimits.bind(this);
  }

  /**
   * Calculate transfer limits based on reserve pool
   */
  public async calculateTransferLimits(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token } = req.query;

      const limits = await reserveLimitService.calculateTransferLimits(
        token as string | undefined
      );

      const response: any = {
        success: true,
        ...limits,
        recommendations: {
          message: `Based on the current reserve of ${limits.reserve} IDRX, we recommend setting transfer limits between ${limits.recommendedMinAmount} and ${limits.recommendedMaxAmount} IDRX.`,
          healthStatus: limits.healthStatus,
          healthDescription: this.getHealthDescription(limits.healthStatus),
        },
      };

      if (limits.tokenInfo) {
        const { formatCurrency } = await import("../utils/general");
        const { getTokenLogoUrl } = await import("../constants/tokens");

        const tokenSymbol = limits.tokenInfo.tokenSymbol;
        const logoUrl =
          getTokenLogoUrl(token as string) ||
          getTokenLogoUrl(tokenSymbol.toLowerCase());

        response.token = token;
        response.tokenSymbol = tokenSymbol;
        response.logoUrl = logoUrl;
        response.tokenPrice = limits.tokenInfo.tokenPrice;
        response.tokenPriceFormatted = formatCurrency(
          limits.tokenInfo.tokenPrice,
          "IDR"
        );

        response.tokenLimits = {
          minTokenAmount: limits.tokenInfo.minTokenAmount,
          maxTokenAmount: limits.tokenInfo.maxTokenAmount,
          recommendedMinTokenAmount: limits.tokenInfo.recommendedMinTokenAmount,
          recommendedMaxTokenAmount: limits.tokenInfo.recommendedMaxTokenAmount,
          formattedMinTokenAmount: `${limits.tokenInfo.minTokenAmount} ${tokenSymbol}`,
          formattedMaxTokenAmount: `${limits.tokenInfo.maxTokenAmount} ${tokenSymbol}`,
          formattedRecommendedMinTokenAmount: `${limits.tokenInfo.recommendedMinTokenAmount} ${tokenSymbol}`,
          formattedRecommendedMaxTokenAmount: `${limits.tokenInfo.recommendedMaxTokenAmount} ${tokenSymbol}`,
        };
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update contract transfer limits
   */
  public async updateTransferLimits(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { minAmount, maxAmount } = req.body;

      const result = await reserveLimitService.updateContractLimits(
        minAmount,
        maxAmount
      );

      res.status(200).json({
        success: result.success,
        message: "Transfer limits updated successfully",
        transactionHash: result.transactionHash,
        updatedLimits: {
          minAmount,
          maxAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get descriptive health status
   */
  private getHealthDescription(status: string): string {
    switch (status) {
      case "EXCELLENT":
        return "The reserve is very healthy. It can support large transfers and high transaction volume.";
      case "GOOD":
        return "The reserve is in good condition. It can support normal operations with moderate transfer limits.";
      case "MODERATE":
        return "The reserve is adequate but could benefit from additional funding. Current transfer limits are reasonable.";
      case "LOW":
        return "The reserve is lower than optimal. Consider limiting maximum transfer amounts and adding more funds to the reserve.";
      case "CRITICAL":
        return "The reserve is critically low. Maximum transfer amounts should be severely restricted until the reserve is replenished.";
      default:
        return "Unable to determine reserve health status.";
    }
  }
}

export default new ReserveLimitController();
