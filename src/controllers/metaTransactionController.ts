import { Request, Response, NextFunction } from "express";
import metaTransactionService from "../services/metaTransactionService";
import { MetaTransferRequest } from "../types";

/**
 * Controller for meta-transaction endpoints
 */
export class MetaTransactionController {
  /**
   * Execute transfer handler
   */
  public async executeTransfer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params: MetaTransferRequest = {
        recipient: req.body.recipient,
        idrxAmount: req.body.idrxAmount,
      };

      const result = await metaTransactionService.executeTransfer(params);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service status handler
   */
  public async getServiceStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = await metaTransactionService.getServiceStatus();
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check handler
   */
  public healthCheck(req: Request, res: Response): void {
    res.status(200).json({ status: "healthy" });
  }
}

export default new MetaTransactionController();
