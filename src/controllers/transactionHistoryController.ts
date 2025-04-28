import { Request, Response, NextFunction } from "express";
import transactionHistoryService, {
  TransactionHistoryParams,
} from "../services/transactionHistoryService";
import { ServiceError } from "../types";

/**
 * Controller for transaction history endpoints
 */
export class TransactionHistoryController {
  /**
   * Get transaction history for an address
   */
  public async getTransactionHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { address } = req.params;

      const params: TransactionHistoryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
        filterBy: req.query.filterBy as "from" | "to" | "all" | undefined,
        sort: req.query.sort as "asc" | "desc" | undefined,
      };

      if (req.query.startDate) {
        params.startDate = new Date(req.query.startDate as string);
        if (isNaN(params.startDate.getTime())) {
          throw new ServiceError("Invalid startDate format", 400);
        }
      }

      if (req.query.endDate) {
        params.endDate = new Date(req.query.endDate as string);
        if (isNaN(params.endDate.getTime())) {
          throw new ServiceError("Invalid endDate format", 400);
        }
      }

      const result = await transactionHistoryService.getTransactionHistory(
        address,
        params
      );

      const summary = this.generateTransactionSummary(result.transactions);

      res.status(200).json({
        success: true,
        address,
        ...result,
        summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction details by hash
   */
  public async getTransactionByHash(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { txHash } = req.params;

      const transaction = await transactionHistoryService.getTransactionByHash(
        txHash
      );

      res.status(200).json({
        success: true,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate summary statistics for a list of transactions
   */
  private generateTransactionSummary(transactions: any[]) {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        sentTransactions: 0,
        receivedTransactions: 0,
        totalSent: "0",
        totalReceived: "0",
        lastTransaction: null,
      };
    }

    let sentTransactions = 0;
    let receivedTransactions = 0;
    let totalSentValue = 0;
    let totalReceivedValue = 0;
    let lastTransaction = transactions[0];

    const address = transactions[0].from.toLowerCase();

    for (const tx of transactions) {
      const value = parseFloat(tx.valueInEther) || 0;

      if (tx.from.toLowerCase() === address) {
        sentTransactions++;
        totalSentValue += value;
      } else if (tx.to && tx.to.toLowerCase() === address) {
        receivedTransactions++;
        totalReceivedValue += value;
      }

      if (tx.timestamp > lastTransaction.timestamp) {
        lastTransaction = tx;
      }
    }

    return {
      totalTransactions: transactions.length,
      sentTransactions,
      receivedTransactions,
      totalSent: totalSentValue.toFixed(6),
      totalReceived: totalReceivedValue.toFixed(6),
      lastTransaction: lastTransaction.formattedDate,
    };
  }
}

export default new TransactionHistoryController();
