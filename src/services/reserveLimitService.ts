import { ethers } from "ethers";
import { ServiceError } from "../types";
import { getContract, formatAmount } from "../utils/blockchain";

/**
 * Interface for transfer limit calculation result
 */
export interface TransferLimitResult {
  reserve: string;
  minTransferAmount: string;
  recommendedMinAmount: string;
  maxTransferAmount: string;
  recommendedMaxAmount: string;
  reserveUtilizationPercentage: string;
  healthStatus: "EXCELLENT" | "GOOD" | "MODERATE" | "LOW" | "CRITICAL";
}

/**
 * Service for calculating transfer limits based on reserve pool size
 */
export class ReserveLimitService {
  /**
   * Calculate recommended transfer limits based on current reserve
   * @returns Transfer limit calculations
   */
  public async calculateTransferLimits(): Promise<TransferLimitResult> {
    try {
      const contract = getContract();

      const status = await contract.getReserveStatus();
      const minAmount = await contract.minTransferAmount();

      const reserve = status.reserve;
      const contractMaxAmount = status.effectiveMaxAmount;

      const reserveFormatted = formatAmount(reserve);
      const minAmountFormatted = formatAmount(minAmount);
      const maxAmountFormatted = formatAmount(contractMaxAmount);

      const reserveThresholds = {
        EXCELLENT: 0.01,
        GOOD: 0.02,
        MODERATE: 0.05,
        LOW: 0.1,
        CRITICAL: 0.2,
      };

      const reserveValue = parseFloat(reserveFormatted);
      let recommendedMaxAmount: number;
      let healthStatus: "EXCELLENT" | "GOOD" | "MODERATE" | "LOW" | "CRITICAL";

      if (reserveValue >= 10000000) {
        recommendedMaxAmount = reserveValue * reserveThresholds.EXCELLENT;
        healthStatus = "EXCELLENT";
      } else if (reserveValue >= 1000000) {
        recommendedMaxAmount = reserveValue * reserveThresholds.GOOD;
        healthStatus = "GOOD";
      } else if (reserveValue >= 100000) {
        recommendedMaxAmount = reserveValue * reserveThresholds.MODERATE;
        healthStatus = "MODERATE";
      } else if (reserveValue >= 10000) {
        recommendedMaxAmount = reserveValue * reserveThresholds.LOW;
        healthStatus = "LOW";
      } else {
        recommendedMaxAmount = reserveValue * reserveThresholds.CRITICAL;
        healthStatus = "CRITICAL";
      }

      const recommendedMinAmount = Math.max(
        parseFloat(minAmountFormatted),
        Math.min(100, recommendedMaxAmount * 0.001)
      );

      const utilizationPercentage = (recommendedMaxAmount / reserveValue) * 100;

      return {
        reserve: reserveFormatted,
        minTransferAmount: minAmountFormatted,
        recommendedMinAmount: recommendedMinAmount.toFixed(2),
        maxTransferAmount: maxAmountFormatted,
        recommendedMaxAmount: recommendedMaxAmount.toFixed(2),
        reserveUtilizationPercentage: utilizationPercentage.toFixed(2) + "%",
        healthStatus,
      };
    } catch (error) {
      console.error("Error calculating transfer limits:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError("Failed to calculate transfer limits", 500);
    }
  }

  /**
   * Update contract transfer limits based on calculated values
   * @param minAmount Minimum transfer amount to set (in IDRX)
   * @param maxAmount Maximum transfer amount to set (in IDRX)
   * @returns Success status
   */
  public async updateContractLimits(
    minAmount: string,
    maxAmount: string
  ): Promise<{ success: boolean; transactionHash?: string }> {
    try {
      const contract = getContract();

      const minAmountBN = ethers.utils.parseUnits(minAmount, 18);
      const maxAmountBN = ethers.utils.parseUnits(maxAmount, 18);

      if (minAmountBN.lte(0)) {
        throw new ServiceError("Minimum amount must be greater than 0", 400);
      }

      if (maxAmountBN.lte(minAmountBN)) {
        throw new ServiceError(
          "Maximum amount must be greater than minimum amount",
          400
        );
      }

      const status = await contract.getReserveStatus();
      const reserve = status.reserve;

      if (maxAmountBN.gt(reserve.mul(50).div(100))) {
        throw new ServiceError(
          "Maximum amount cannot exceed 50% of the reserve",
          400
        );
      }

      const tx = await contract.updateTransferLimits(minAmountBN, maxAmountBN);

      const receipt = await tx.wait();

      return {
        success: receipt.status === 1,
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error("Error updating contract limits:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      if (
        (error as any).code === "UNPREDICTABLE_GAS_LIMIT" ||
        (error as any).code === "CALL_EXCEPTION"
      ) {
        throw new ServiceError(
          `Contract error: ${(error as any).reason || "Execution reverted"}`,
          400
        );
      }

      throw new ServiceError("Failed to update contract limits", 500);
    }
  }
}

export default new ReserveLimitService();
