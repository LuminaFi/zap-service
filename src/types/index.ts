import { ethers } from "ethers";

export interface MetaTransferRequest {
  recipient: string;
  idrxAmount: string;
}

export interface MetaTransferResponse {
  success: boolean;
  transferId?: string;
  recipient?: string;
  amount?: string;
  transactionHash?: string;
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  isActive?: boolean;
  reserve?: string;
  minTransferAmount?: string;
  maxTransferAmount?: string;
  error?: string;
}

export interface ReserveStatus {
  reserve: ethers.BigNumber;
  effectiveMaxAmount: ethers.BigNumber;
  isActive: boolean;
}

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ServiceError";
  }
}
