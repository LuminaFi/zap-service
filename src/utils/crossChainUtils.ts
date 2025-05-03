import { ethers } from "ethers";
import {
  NETWORKS,
  SUPPORTED_TOKENS_BY_NETWORK,
  getTokenAddress,
  getTokenDecimals,
} from "../constants/tokens";
import { ServiceError } from "../types";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

/**
 * Interface for provider and network info
 */
interface NetworkProvider {
  provider: ethers.providers.JsonRpcProvider;
  chainId: number;
  isTestnet: boolean;
}

const providerCache: Record<string, NetworkProvider> = {};

/**
 * Get RPC provider for a specific network
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param isTestnet Whether to use testnet
 * @returns Provider and network info
 */
export function getNetworkProvider(
  network: string,
  isTestnet: boolean = false
): NetworkProvider {
  const normalizedNetwork = network.toLowerCase();
  const cacheKey = `${normalizedNetwork}-${isTestnet ? "testnet" : "mainnet"}`;

  if (providerCache[cacheKey]) {
    return providerCache[cacheKey];
  }

  const networkConfig = NETWORKS[normalizedNetwork as keyof typeof NETWORKS];
  if (!networkConfig) {
    throw new ServiceError(`Unsupported network: ${network}`, 400);
  }

  const rpcUrl = isTestnet
    ? networkConfig.testnetRpcUrl
    : networkConfig.mainnetRpcUrl;

  const chainId = isTestnet
    ? networkConfig.testnetChainId
    : networkConfig.mainnetChainId;

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const networkProvider: NetworkProvider = {
      provider,
      chainId,
      isTestnet,
    };

    providerCache[cacheKey] = networkProvider;
    return networkProvider;
  } catch (error) {
    throw new ServiceError(
      `Failed to create provider for ${network} ${
        isTestnet ? "testnet" : "mainnet"
      }: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Get token contract instance
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param signerOrProvider Signer or provider to use with contract
 * @param isTestnet Whether to use testnet address
 * @returns Token contract instance
 */
export function getTokenContract(
  network: string,
  tokenSymbol: string,
  signerOrProvider: ethers.providers.Provider | ethers.Signer,
  isTestnet: boolean = false
): ethers.Contract {
  const tokenAddress = getTokenAddress(network, tokenSymbol, isTestnet);

  if (!tokenAddress) {
    throw new ServiceError(
      `Token ${tokenSymbol} not supported on ${network} ${
        isTestnet ? "testnet" : "mainnet"
      }`,
      400
    );
  }

  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
}

/**
 * Format token amount from raw (wei) to human-readable format
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param amount Amount in wei (or smallest unit)
 * @returns Formatted amount with proper decimals
 */
export function formatTokenAmount(
  network: string,
  tokenSymbol: string,
  amount: ethers.BigNumberish
): string {
  const decimals = getTokenDecimals(network, tokenSymbol);

  if (decimals === undefined) {
    throw new ServiceError(
      `Token ${tokenSymbol} not supported on ${network}`,
      400
    );
  }

  return ethers.utils.formatUnits(amount, decimals);
}

/**
 * Parse token amount from human-readable to raw (wei) format
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param amount Human-readable amount
 * @returns Amount in wei (or smallest unit)
 */
export function parseTokenAmount(
  network: string,
  tokenSymbol: string,
  amount: string
): ethers.BigNumber {
  const decimals = getTokenDecimals(network, tokenSymbol);

  if (decimals === undefined) {
    throw new ServiceError(
      `Token ${tokenSymbol} not supported on ${network}`,
      400
    );
  }

  try {
    return ethers.utils.parseUnits(amount, decimals);
  } catch (error) {
    throw new ServiceError(
      `Invalid amount format: ${(error as Error).message}`,
      400
    );
  }
}

/**
 * Check if an address has sufficient token balance
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param address Wallet address to check
 * @param requiredAmount Amount required (in token's smallest unit)
 * @param isTestnet Whether to use testnet
 * @returns Promise resolving to boolean indicating if balance is sufficient
 */
export async function hasTokenBalance(
  network: string,
  tokenSymbol: string,
  address: string,
  requiredAmount: ethers.BigNumberish,
  isTestnet: boolean = false
): Promise<boolean> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);

    if (
      tokenSymbol.toLowerCase() ===
      NETWORKS[
        network as keyof typeof NETWORKS
      ]?.nativeCurrency.symbol.toLowerCase()
    ) {
      const balance = await provider.getBalance(address);
      return balance.gte(requiredAmount);
    }

    const tokenContract = getTokenContract(
      network,
      tokenSymbol,
      provider,
      isTestnet
    );
    const balance = await tokenContract.balanceOf(address);
    return balance.gte(requiredAmount);
  } catch (error) {
    console.error(`Error checking token balance: ${(error as Error).message}`);
    throw new ServiceError(
      `Failed to check token balance: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Get token balance for an address
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param address Wallet address to check
 * @param isTestnet Whether to use testnet
 * @returns Promise resolving to balance in wei and formatted amount
 */
export async function getTokenBalance(
  network: string,
  tokenSymbol: string,
  address: string,
  isTestnet: boolean = false
): Promise<{
  balance: ethers.BigNumber;
  formattedBalance: string;
}> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);
    const networkConfig = NETWORKS[network as keyof typeof NETWORKS];

    if (!networkConfig) {
      throw new ServiceError(`Unsupported network: ${network}`, 400);
    }

    let balance: ethers.BigNumber;

    if (
      tokenSymbol.toLowerCase() ===
      networkConfig.nativeCurrency.symbol.toLowerCase()
    ) {
      balance = await provider.getBalance(address);
      return {
        balance,
        formattedBalance: ethers.utils.formatUnits(
          balance,
          networkConfig.nativeCurrency.decimals
        ),
      };
    }

    const tokenContract = getTokenContract(
      network,
      tokenSymbol,
      provider,
      isTestnet
    );
    balance = await tokenContract.balanceOf(address);

    const decimals = getTokenDecimals(network, tokenSymbol) || 18;

    return {
      balance,
      formattedBalance: ethers.utils.formatUnits(balance, decimals),
    };
  } catch (error) {
    console.error(`Error getting token balance: ${(error as Error).message}`);
    throw new ServiceError(
      `Failed to get token balance: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Estimate gas for token transfer
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param sender Sender address
 * @param recipient Recipient address
 * @param amount Amount to transfer (in token's smallest unit)
 * @param isTestnet Whether to use testnet
 * @returns Estimated gas limit for the transaction
 */
export async function estimateTransferGas(
  network: string,
  tokenSymbol: string,
  sender: string,
  recipient: string,
  amount: ethers.BigNumberish,
  isTestnet: boolean = false
): Promise<ethers.BigNumber> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);
    const networkConfig = NETWORKS[network as keyof typeof NETWORKS];

    if (!networkConfig) {
      throw new ServiceError(`Unsupported network: ${network}`, 400);
    }

    if (
      tokenSymbol.toLowerCase() ===
      networkConfig.nativeCurrency.symbol.toLowerCase()
    ) {
      return ethers.BigNumber.from(21000);
    }

    const tokenContract = getTokenContract(
      network,
      tokenSymbol,
      provider,
      isTestnet
    );

    try {
      const gasEstimate = await tokenContract.estimateGas.transfer(
        recipient,
        amount,
        {
          from: sender,
        }
      );

      return gasEstimate.mul(120).div(100);
    } catch (error) {
      console.warn(
        `Could not estimate gas precisely: ${(error as Error).message}`
      );

      return ethers.BigNumber.from(100000);
    }
  } catch (error) {
    console.error(`Error estimating transfer gas: ${(error as Error).message}`);
    throw new ServiceError(
      `Failed to estimate transfer gas: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Get current gas price for a network
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param isTestnet Whether to use testnet
 * @returns Current gas price in wei
 */
export async function getCurrentGasPrice(
  network: string,
  isTestnet: boolean = false
): Promise<ethers.BigNumber> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);
    return await provider.getGasPrice();
  } catch (error) {
    console.error(`Error getting gas price: ${(error as Error).message}`);
    throw new ServiceError(
      `Failed to get gas price: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Generate a new random wallet
 * @returns New ethers wallet instance
 */
export function generateWallet(): ethers.Wallet {
  return ethers.Wallet.createRandom();
}

/**
 * Check if a string is a valid Ethereum address
 * @param address Address to validate
 * @returns Boolean indicating if address is valid
 */
export function isValidAddress(address: string): boolean {
  return ethers.utils.isAddress(address);
}

/**
 * Sign an ERC20 token transfer
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param tokenSymbol Token symbol ('eth', 'usdt', etc.)
 * @param privateKey Sender's private key
 * @param recipient Recipient address
 * @param amount Amount to transfer (in token's smallest unit)
 * @param isTestnet Whether to use testnet
 * @returns Signed transaction
 */
export async function createSignedTokenTransfer(
  network: string,
  tokenSymbol: string,
  privateKey: string,
  recipient: string,
  amount: ethers.BigNumberish,
  isTestnet: boolean = false
): Promise<string> {
  try {
    if (!isValidAddress(recipient)) {
      throw new ServiceError("Invalid recipient address", 400);
    }

    const { provider, chainId } = getNetworkProvider(network, isTestnet);
    const wallet = new ethers.Wallet(privateKey, provider);
    const networkConfig = NETWORKS[network as keyof typeof NETWORKS];

    if (!networkConfig) {
      throw new ServiceError(`Unsupported network: ${network}`, 400);
    }

    if (
      tokenSymbol.toLowerCase() ===
      networkConfig.nativeCurrency.symbol.toLowerCase()
    ) {
      const tx = {
        to: recipient,
        value: amount,
        chainId,
        gasPrice: await getCurrentGasPrice(network, isTestnet),
        gasLimit: ethers.utils.hexlify(21000),
        nonce: await provider.getTransactionCount(wallet.address),
      };

      return await wallet.signTransaction(tx);
    }

    const tokenContract = getTokenContract(
      network,
      tokenSymbol,
      wallet,
      isTestnet
    );

    const data = tokenContract.interface.encodeFunctionData("transfer", [
      recipient,
      amount,
    ]);
    const tokenAddress = getTokenAddress(network, tokenSymbol, isTestnet);

    const tx = {
      to: tokenAddress,
      data,
      chainId,
      value: 0,
      gasPrice: await getCurrentGasPrice(network, isTestnet),
      gasLimit: await estimateTransferGas(
        network,
        tokenSymbol,
        wallet.address,
        recipient,
        amount,
        isTestnet
      ),
      nonce: await provider.getTransactionCount(wallet.address),
    };

    return await wallet.signTransaction(tx);
  } catch (error) {
    console.error(
      `Error creating signed token transfer: ${(error as Error).message}`
    );
    throw new ServiceError(
      `Failed to create signed token transfer: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Broadcast a signed transaction
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param signedTx Signed transaction hex string
 * @param isTestnet Whether to use testnet
 * @returns Transaction hash
 */
export async function broadcastTransaction(
  network: string,
  signedTx: string,
  isTestnet: boolean = false
): Promise<string> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);
    const tx = await provider.sendTransaction(signedTx);
    return tx.hash;
  } catch (error) {
    console.error(
      `Error broadcasting transaction: ${(error as Error).message}`
    );
    throw new ServiceError(
      `Failed to broadcast transaction: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Get transaction status
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param txHash Transaction hash
 * @param isTestnet Whether to use testnet
 * @returns Transaction status and details
 */
export async function getTransactionStatus(
  network: string,
  txHash: string,
  isTestnet: boolean = false
): Promise<{
  status: "pending" | "confirmed" | "failed";
  receipt?: ethers.providers.TransactionReceipt;
  confirmations: number;
  timestamp?: number;
}> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);

    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      throw new ServiceError(`Transaction not found: ${txHash}`, 404);
    }

    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        status: "pending",
        confirmations: tx.confirmations || 0,
      };
    }

    const block = await provider.getBlock(receipt.blockNumber);

    return {
      status: receipt.status ? "confirmed" : "failed",
      receipt,
      confirmations: receipt.confirmations,
      timestamp: block.timestamp * 1000,
    };
  } catch (error) {
    console.error(
      `Error getting transaction status: ${(error as Error).message}`
    );
    throw new ServiceError(
      `Failed to get transaction status: ${(error as Error).message}`,
      500
    );
  }
}

/**
 * Wait for transaction confirmation
 * @param network Network ID ('ethereum', 'bsc', or 'polygon')
 * @param txHash Transaction hash
 * @param confirmations Number of confirmations to wait for
 * @param isTestnet Whether to use testnet
 * @returns Transaction receipt
 */
export async function waitForConfirmation(
  network: string,
  txHash: string,
  confirmations: number = 1,
  isTestnet: boolean = false
): Promise<ethers.providers.TransactionReceipt> {
  try {
    const { provider } = getNetworkProvider(network, isTestnet);
    return await provider.waitForTransaction(txHash, confirmations);
  } catch (error) {
    console.error(
      `Error waiting for confirmation: ${(error as Error).message}`
    );
    throw new ServiceError(
      `Failed while waiting for confirmation: ${(error as Error).message}`,
      500
    );
  }
}
