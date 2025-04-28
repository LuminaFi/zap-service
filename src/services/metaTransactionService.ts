import { ethers } from "ethers";
import {
  MetaTransferRequest,
  MetaTransferResponse,
  StatusResponse,
  ServiceError,
} from "../types";
import {
  getContract,
  generateTransferId,
  parseAmount,
  formatAmount,
  isValidAddress,
} from "../utils/blockchain";

/**
 * Service class for handling meta-transactions
 */
export class MetaTransactionService {
  /**
   * Execute transferIDRX meta-transaction
   * @param params Request parameters
   * @returns Transaction response
   */
  public async executeTransfer(
    params: MetaTransferRequest
  ): Promise<MetaTransferResponse> {
    const { recipient, idrxAmount } = params;

    if (!isValidAddress(recipient)) {
      throw new ServiceError("Invalid recipient address", 400);
    }

    const amountBN = parseAmount(idrxAmount);

    try {
      const contract = getContract();

      const minAmount = await contract.minTransferAmount();
      if (amountBN.lt(minAmount)) {
        throw new ServiceError(
          `Amount below minimum (${formatAmount(minAmount)} IDRX)`,
          400
        );
      }

      const maxAmount = await contract.getEffectiveMaxTransferAmount();
      if (amountBN.gt(maxAmount)) {
        throw new ServiceError(
          `Amount exceeds maximum (${formatAmount(maxAmount)} IDRX)`,
          400
        );
      }

      const status = await contract.getReserveStatus();
      if (!status.isActive) {
        throw new ServiceError(
          "Service is currently unavailable (contract is paused)",
          503
        );
      }

      if (amountBN.gt(status.reserve)) {
        throw new ServiceError("Insufficient reserve", 400);
      }

      const transferId = generateTransferId();

      console.log(`Executing meta-transaction for recipient ${recipient}`);
      console.log(`Transfer ID: ${transferId}`);
      console.log(`IDRX Amount: ${idrxAmount}`);

      const tx = await contract.transferIDRX(transferId, recipient, amountBN);

      console.log(`Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait();

      console.log(`Transaction confirmed: ${receipt.transactionHash}`);

      if (receipt.status !== 1) {
        throw new ServiceError("Transaction failed", 500);
      }

      return {
        success: true,
        transferId: ethers.utils.hexlify(transferId),
        recipient,
        amount: idrxAmount,
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      console.error("Error executing meta-transaction:", error);

      if (
        (error as any).code === "UNPREDICTABLE_GAS_LIMIT" ||
        (error as any).code === "CALL_EXCEPTION"
      ) {
        throw new ServiceError(
          `Contract error: ${(error as any).reason || "Execution reverted"}`,
          400
        );
      }

      throw new ServiceError(
        (error as any).message || "Failed to execute transfer",
        500
      );
    }
  }

  /**
   * Get service status
   * @returns Status response
   */
  public async getServiceStatus(): Promise<StatusResponse> {
    try {
      const contract = getContract();

      const status = await contract.getReserveStatus();
      const minAmount = await contract.minTransferAmount();

      return {
        success: true,
        isActive: status.isActive,
        reserve: formatAmount(status.reserve),
        minTransferAmount: formatAmount(minAmount),
        maxTransferAmount: formatAmount(status.effectiveMaxAmount),
      };
    } catch (error) {
      console.error("Error fetching service status:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        (error as any).message || "Failed to fetch service status",
        500
      );
    }
  }
}

export default new MetaTransactionService();
