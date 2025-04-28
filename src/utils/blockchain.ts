import { ethers } from "ethers";
import crypto from "crypto";
import config from "../config/config";
import { ServiceError } from "../types";

let provider: ethers.providers.JsonRpcProvider;
let wallet: ethers.Wallet;
let contract: ethers.Contract;

/**
 * Initialize blockchain connection and contract instance
 */
export const initializeBlockchain = (): void => {
  try {
    provider = new ethers.providers.JsonRpcProvider(
      config.blockchain.liskRpcUrl
    );
    wallet = new ethers.Wallet(
      config.blockchain.operatorPrivateKey as string,
      provider
    );
    contract = new ethers.Contract(
      config.blockchain.contractAddress as string,
      config.contractAbi,
      wallet
    );
  } catch (error) {
    console.error("Failed to initialize blockchain connection:", error);
    throw new ServiceError("Failed to initialize blockchain connection", 500);
  }
};

/**
 * Generate a random transfer ID
 * @returns Random bytes32 ID
 */
export const generateTransferId = (): string => {
  return ethers.utils.id(crypto.randomBytes(16).toString("hex"));
};

/**
 * Get contract
 * @returns Ethers Contract instance
 */
export const getContract = (): ethers.Contract => {
  if (!contract) {
    throw new ServiceError("Blockchain connection not initialized", 500);
  }
  return contract;
};

/**
 * Validate and format amount
 * @param amount Amount as string
 * @returns BigNumber representation of the amount
 */
export const parseAmount = (amount: string): ethers.BigNumber => {
  try {
    return ethers.utils.parseUnits(amount, 18);
  } catch (error) {
    throw new ServiceError("Invalid amount format", 400);
  }
};

/**
 * Format BigNumber to string with 18 decimals
 * @param amount BigNumber amount
 * @returns Formatted string amount
 */
export const formatAmount = (amount: ethers.BigNumber): string => {
  return ethers.utils.formatUnits(amount, 18);
};

/**
 * Validate address format
 * @param address Ethereum-compatible address
 * @returns true if valid, false if invalid
 */
export const isValidAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address);
};
