import { Request, Response, NextFunction } from "express";
import idrxBalanceService from "../services/idrxBalanceService";
import { formatCurrency } from "../utils/general";

/**
 * Controller for IDRX balance endpoints
 */
export class IDRXBalanceController {
  /**
   * Get IDRX token balance for an address
   */
  public async getBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { address } = req.params;

      const balanceData = await idrxBalanceService.getBalance(address);

      // Format as IDR currency for display purposes
      const idrBalanceFormatted = formatCurrency(
        parseFloat(balanceData.formattedBalance),
        "IDR"
      );

      res.status(200).json({
        success: true,
        ...balanceData,
        idrBalanceFormatted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get IDRX token information
   */
  public async getTokenInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tokenInfo = await idrxBalanceService.getTokenInfo();

      res.status(200).json({
        success: true,
        ...tokenInfo,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new IDRXBalanceController();
