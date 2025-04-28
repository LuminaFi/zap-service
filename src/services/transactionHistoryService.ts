import axios from "axios";
import { ServiceError } from "../types";
import { isValidAddress } from "../utils/blockchain";

/**
 * Interface for transaction data returned from Blockscout API
 */
export interface BlockscoutTransaction {
  blockHash: string;
  blockNumber: string;
  confirmations: string;
  contractAddress: string | null;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  input: string;
  isError: string;
  nonce: string;
  timeStamp: string;
  to: string;
  transactionIndex: string;
  txreceipt_status: string;
  value: string;
  methodId: string;
  functionName: string;
}

/**
 * Interface for parsed transaction data
 */
export interface ParsedTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueInEther: string;
  timestamp: number;
  formattedDate: string;
  status: "success" | "error" | "pending";
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  isContractInteraction: boolean;
  functionName: string | null;
  methodId: string | null;
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  offset?: number;
  limit?: number;
}

/**
 * Interface for transaction history query parameters
 */
export interface TransactionHistoryParams extends PaginationParams {
  filterBy?: "from" | "to" | "all";
  startDate?: Date;
  endDate?: Date;
  sort?: "asc" | "desc";
}

/**
 * Interface for transaction history response
 */
export interface TransactionHistoryResponse {
  transactions: ParsedTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Service for retrieving transaction history from Blockscout API
 */
export class TransactionHistoryService {
  private readonly BLOCKSCOUT_API_URL =
    "https://sepolia-blockscout.lisk.com/api";
  private readonly BLOCKSCOUT_MODULE = "account";
  private readonly BLOCKSCOUT_ACTION = "txlist";

  /**
   * Fetch transaction history for an address
   * @param address Ethereum address to get transactions for
   * @param params Query parameters for pagination and filtering
   * @returns Transaction history with pagination info
   */
  public async getTransactionHistory(
    address: string,
    params: TransactionHistoryParams = {}
  ): Promise<TransactionHistoryResponse> {
    if (!isValidAddress(address)) {
      throw new ServiceError("Invalid Ethereum address", 400);
    }

    try {
      const {
        page = 1,
        offset = 0,
        limit = 20,
        filterBy = "all",
        startDate,
        endDate,
        sort = "desc",
      } = params;

      const queryParams: Record<string, string> = {
        module: this.BLOCKSCOUT_MODULE,
        action: this.BLOCKSCOUT_ACTION,
        address,
        page: page.toString(),
        offset: offset.toString(),
        limit: limit.toString(),
        sort,
      };

      if (startDate) {
        queryParams.startblock = "0";
      }

      if (endDate) {
        queryParams.endblock = "999999999";
      }

      const response = await axios.get(`${this.BLOCKSCOUT_API_URL}`, {
        params: queryParams,
        timeout: 10000,
      });

      if (response.data.status === "0") {
        if (response.data.message === "No transactions found") {
          return {
            transactions: [],
            pagination: {
              page,
              limit,
              total: 0,
              hasMore: false,
            },
          };
        }
        throw new ServiceError(
          `Blockscout API error: ${response.data.message}`,
          500
        );
      }

      let transactions = response.data.result as BlockscoutTransaction[];

      if (filterBy === "from") {
        transactions = transactions.filter(
          (tx) => tx.from.toLowerCase() === address.toLowerCase()
        );
      } else if (filterBy === "to") {
        transactions = transactions.filter(
          (tx) => tx.to && tx.to.toLowerCase() === address.toLowerCase()
        );
      }

      if (startDate) {
        const startTimestamp = Math.floor(startDate.getTime() / 1000);
        transactions = transactions.filter(
          (tx) => parseInt(tx.timeStamp) >= startTimestamp
        );
      }

      if (endDate) {
        const endTimestamp = Math.floor(endDate.getTime() / 1000);
        transactions = transactions.filter(
          (tx) => parseInt(tx.timeStamp) <= endTimestamp
        );
      }

      const parsedTransactions = transactions.map((tx) =>
        this.parseTransaction(tx)
      );

      const total = transactions.length;

      return {
        transactions: parsedTransactions,
        pagination: {
          page,
          limit,
          total,
          hasMore: total >= limit,
        },
      };
    } catch (error) {
      console.error("Error fetching transaction history:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      if ((error as any).response) {
        if ((error as any).response.status === 429) {
          throw new ServiceError("Blockscout API rate limit exceeded", 429);
        }
        throw new ServiceError(
          `Blockscout API error: ${
            (error as any).response.data?.message || (error as any).message
          }`,
          500
        );
      }

      throw new ServiceError(
        `Failed to fetch transaction history: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Get transaction details for a specific transaction hash
   * @param txHash Transaction hash
   * @returns Detailed transaction information
   */
  public async getTransactionByHash(
    txHash: string
  ): Promise<ParsedTransaction> {
    try {
      const response = await axios.get(`${this.BLOCKSCOUT_API_URL}`, {
        params: {
          module: "proxy",
          action: "eth_getTransactionByHash",
          txhash: txHash,
        },
        timeout: 10000,
      });

      if (response.data.error) {
        throw new ServiceError(
          `Blockscout API error: ${response.data.error.message}`,
          500
        );
      }

      if (!response.data.result) {
        throw new ServiceError(`Transaction not found: ${txHash}`, 404);
      }

      const receiptResponse = await axios.get(`${this.BLOCKSCOUT_API_URL}`, {
        params: {
          module: "proxy",
          action: "eth_getTransactionReceipt",
          txhash: txHash,
        },
        timeout: 10000,
      });

      if (!receiptResponse.data.result) {
        throw new ServiceError(`Transaction receipt not found: ${txHash}`, 404);
      }

      const tx = response.data.result;
      const receipt = receiptResponse.data.result;

      const formattedTx: BlockscoutTransaction = {
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber,
        confirmations: "0",
        contractAddress: receipt.contractAddress,
        cumulativeGasUsed: receipt.cumulativeGasUsed,
        from: tx.from,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        gasUsed: receipt.gasUsed,
        hash: tx.hash,
        input: tx.input,
        isError: receipt.status === "0x1" ? "0" : "1",
        nonce: tx.nonce,
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        to: tx.to,
        transactionIndex: tx.transactionIndex,
        txreceipt_status: receipt.status.replace("0x", ""),
        value: tx.value,
        methodId:
          tx.input && tx.input.length >= 10 ? tx.input.slice(0, 10) : "",
        functionName: "",
      };

      return this.parseTransaction(formattedTx);
    } catch (error) {
      console.error("Error fetching transaction by hash:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Failed to fetch transaction: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Parse raw transaction data into a more usable format
   * @param tx Raw transaction data from Blockscout
   * @returns Parsed transaction data
   */
  private parseTransaction(tx: BlockscoutTransaction): ParsedTransaction {
    const valueInWei = parseInt(tx.value, 16) || tx.value;
    const valueInEther = this.weiToEther(valueInWei);

    const timestamp = parseInt(tx.timeStamp);
    const date = new Date(timestamp * 1000);

    let status: "success" | "error" | "pending" = "pending";
    if (tx.txreceipt_status === "1" || tx.isError === "0") {
      status = "success";
    } else if (tx.txreceipt_status === "0" || tx.isError === "1") {
      status = "error";
    }

    const isContractInteraction =
      tx.input && tx.input !== "0x" && tx.input.length > 2;

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: valueInWei.toString(),
      valueInEther,
      timestamp,
      formattedDate: date.toISOString(),
      status,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      blockNumber: parseInt(tx.blockNumber),
      isContractInteraction: Boolean(isContractInteraction),
      functionName: tx.functionName || null,
      methodId: isContractInteraction ? tx.methodId : null,
    };
  }

  /**
   * Convert wei to ether (with proper decimal formatting)
   * @param wei Wei amount (as string or number)
   * @returns Ether amount as string
   */
  private weiToEther(wei: string | number): string {
    const weiValue = typeof wei === "string" ? wei : wei.toString();
    const divisor = 1e18;

    try {
      const weiNumber = BigInt(weiValue);
      const etherValue = Number(weiNumber) / divisor;

      return etherValue.toFixed(6).replace(/\.?0+$/, "");
    } catch (e) {
      return "0";
    }
  }
}

export default new TransactionHistoryService();
