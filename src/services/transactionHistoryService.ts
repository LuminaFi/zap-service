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
  valueInIDR: number | null;
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
    "https://sepolia-blockscout.lisk.com/api/v2";

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
        limit = 20,
        filterBy = "to",
        startDate,
        endDate,
        sort = "desc",
      } = params;

      let endpoint: string;
      if (filterBy === "from") {
        endpoint = `${this.BLOCKSCOUT_API_URL}/addresses/${address}/transactions`;
      } else if (filterBy === "to") {
        endpoint = `${this.BLOCKSCOUT_API_URL}/addresses/${address}/token-transfers`;
      } else {
        endpoint = `${this.BLOCKSCOUT_API_URL}/addresses/${address}/transactions`;
      }

      const queryParams: Record<string, string | number> = {
        page,
        limit,
        sort_order: sort,
        token: process.env.IDRX_TOKEN_ADDRESS || '0x140fb356730a7f2D018849a14773c02C0869DEAa'
      };

      if (startDate) {
        queryParams.start_timestamp = Math.floor(startDate.getTime() / 1000);
      }

      if (endDate) {
        queryParams.end_timestamp = Math.floor(endDate.getTime() / 1000);
      }

      const response = await axios.get(endpoint, {
        params: queryParams,
        timeout: 10000,
      });

      if (!response.data || !response.data.items) {
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

      let transactions = response.data.items;

      if (filterBy === "from" && address) {
        transactions = transactions.filter(
          (tx: any) => tx.from.hash.toLowerCase() === address.toLowerCase()
        );
      } else if (filterBy === "to" && address) {
        transactions = transactions.filter(
          (tx: any) =>
            tx.to &&
            tx.to.hash &&
            tx.to.hash.toLowerCase() === address.toLowerCase()
        );
      }

      const parsedTransactions = transactions.map((tx: any) =>
        this.parseTransactionV2(tx, address)
      );

      return {
        transactions: parsedTransactions,
        pagination: {
          page,
          limit,
          total: response.data.next_page_params
            ? page * limit + 1
            : transactions.length,
          hasMore: !!response.data.next_page_params,
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
      const formattedTxHash = txHash.startsWith("0x") ? txHash : `0x${txHash}`;

      const endpoint = `${this.BLOCKSCOUT_API_URL}/transactions/${formattedTxHash}/token-transfers`;

      const response = await axios.get(endpoint, {
        timeout: 10000,
      });

      if (!response.data) {
        throw new ServiceError(`Transaction not found: ${txHash}`, 404);
      }

      return this.parseTransactionV2(response.data.items[0]);
    } catch (error) {
      console.error("Error fetching transaction by hash:", error);

      if (error instanceof ServiceError) {
        throw error;
      }

      if ((error as any).response && (error as any).response.status === 404) {
        throw new ServiceError(`Transaction not found: ${txHash}`, 404);
      }

      throw new ServiceError(
        `Failed to fetch transaction: ${(error as any).message}`,
        500
      );
    }
  }

  /**
   * Parse transaction data from Blockscout API v2 to our standard format
   * @param tx Transaction data from Blockscout API v2
   * @param contextAddress Optional address for context (to determine tx direction)
   * @returns Parsed transaction data
   */
  private parseTransactionV2(
    tx: any,
    contextAddress?: string
  ): ParsedTransaction {
    const valueInWei = tx.value || "0";
    const valueInEther = this.weiToEther(valueInWei);

    const timestamp = tx.timestamp
      ? tx.timestamp
      : Date.now();
    const date = new Date(timestamp);

    let status: "success" | "error" | "pending" = "pending";
    if (tx.status === "ok" || tx.status === "success" || tx.status === true) {
      status = "success";
    } else if (tx.status === "error" || tx.status === false) {
      status = "error";
    }

    const fromAddress = tx.from?.hash || tx.from || "";
    const toAddress = tx.to?.hash || tx.to || "";

    const input = tx.raw_input || tx.input || "0x";
    const isContractInteraction = input && input !== "0x" && input.length > 2;

    const methodId =
      isContractInteraction && input.length >= 10 ? input.slice(0, 10) : null;

    const gasUsed = tx.gas_used?.toString() || "0";
    const gasPrice = tx.gas_price?.toString() || "0";

    const blockNumber = tx.block ? parseInt(tx.block) : 0;

    return {
      hash: tx.transaction_hash,
      from: fromAddress,
      to: toAddress,
      value: valueInWei,
      valueInEther,
      timestamp,
      formattedDate: date.toISOString(),
      status,
      gasUsed,
      gasPrice,
      blockNumber,
      isContractInteraction,
      functionName: tx.method || null,
      methodId,
      valueInIDR: tx.total.value,
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
      try {
        const etherValue = parseFloat(weiValue) / divisor;
        return etherValue.toFixed(6).replace(/\.?0+$/, "");
      } catch {
        return "0";
      }
    }
  }
}

export default new TransactionHistoryService();
