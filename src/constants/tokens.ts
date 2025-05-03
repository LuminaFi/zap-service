/**
 * Network configuration constants
 */
export interface NetworkConfig {
  id: string;
  name: string;
  mainnetRpcUrl: string;
  testnetRpcUrl: string;
  mainnetChainId: number;
  testnetChainId: number;
  mainnetExplorerUrl: string;
  testnetExplorerUrl: string;
  logoUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Token information for a specific network
 */
export interface TokenNetworkInfo {
  mainnet?: string;
  testnet?: string;
  decimals: number;
}

/**
 * Interface for token information
 */
export interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  logoUrl: string;
}

/**
 * Network configurations
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    mainnetRpcUrl:
      process.env.ETH_MAINNET_RPC_URL ||
      "https://mainnet.infura.io/v3/${INFURA_API_KEY}",
    testnetRpcUrl:
      process.env.ETH_TESTNET_RPC_URL ||
      "https://sepolia.infura.io/v3/${INFURA_API_KEY}",
    mainnetChainId: 1,
    testnetChainId: 11155111,
    mainnetExplorerUrl: "https://etherscan.io",
    testnetExplorerUrl: "https://sepolia.etherscan.io",
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  bsc: {
    id: "bsc",
    name: "BNB Smart Chain",
    mainnetRpcUrl:
      process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org",
    testnetRpcUrl:
      process.env.BSC_TESTNET_RPC_URL ||
      "https://data-seed-prebsc-1-s1.binance.org:8545",
    mainnetChainId: 56,
    testnetChainId: 97,
    mainnetExplorerUrl: "https://bscscan.com",
    testnetExplorerUrl: "https://testnet.bscscan.com",
    logoUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    mainnetRpcUrl:
      process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
    testnetRpcUrl:
      process.env.POLYGON_TESTNET_RPC_URL ||
      "https://rpc-mumbai.maticvigil.com",
    mainnetChainId: 137,
    testnetChainId: 80001,
    mainnetExplorerUrl: "https://polygonscan.com",
    testnetExplorerUrl: "https://mumbai.polygonscan.com",
    logoUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
};

/**
 * Supported tokens by network
 */
export const SUPPORTED_TOKENS_BY_NETWORK = {
  ethereum: {
    eth: {
      mainnet:
        process.env.ETH_MAINNET_NATIVE_WRAPPER ||
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      testnet: process.env.ETH_TESTNET_NATIVE_WRAPPER,
      decimals: 18,
    },
    usdt: {
      mainnet:
        process.env.ETH_MAINNET_USDT ||
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      testnet: process.env.ETH_TESTNET_USDT,
      decimals: 6,
    },
    wbtc: {
      mainnet:
        process.env.ETH_MAINNET_WBTC ||
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      testnet: process.env.ETH_TESTNET_WBTC,
      decimals: 8,
    },
    sol: {
      mainnet:
        process.env.ETH_MAINNET_SOL ||
        "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
      testnet: process.env.ETH_TESTNET_SOL,
      decimals: 9,
    },
    pepe: {
      mainnet:
        process.env.ETH_MAINNET_PEPE ||
        "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      testnet: process.env.ETH_TESTNET_PEPE,
      decimals: 18,
    },
  },
  bsc: {
    eth: {
      mainnet:
        process.env.BSC_MAINNET_ETH ||
        "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      testnet: process.env.BSC_TESTNET_ETH,
      decimals: 18,
    },
    usdt: {
      mainnet:
        process.env.BSC_MAINNET_USDT ||
        "0x55d398326f99059fF775485246999027B3197955",
      testnet: process.env.BSC_TESTNET_USDT,
      decimals: 18,
    },
  },
  polygon: {
    eth: {
      mainnet:
        process.env.POLYGON_MAINNET_ETH ||
        "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      testnet: process.env.POLYGON_TESTNET_ETH,
      decimals: 18,
    },
    usdt: {
      mainnet:
        process.env.POLYGON_MAINNET_USDT ||
        "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      testnet: process.env.POLYGON_TESTNET_USDT,
      decimals: 6,
    },
  },
};

/**
 * Token information dictionary with logos
 */
export const TOKEN_INFO: Record<string, TokenInfo> = {
  eth: {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  usdt: {
    id: "tether",
    symbol: "USDT",
    name: "Tether USD",
    logoUrl: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  },
  wbtc: {
    id: "bitcoin",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    logoUrl: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png",
  },
  sol: {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    logoUrl: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
  pepe: {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    logoUrl: "https://cryptologos.cc/logos/pepe-pepe-logo.png",
  },
  bnb: {
    id: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    logoUrl: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  matic: {
    id: "matic-network",
    symbol: "MATIC",
    name: "Polygon",
    logoUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
};

/**
 * Get token address for a specific network and environment
 * @param network Network ID (ethereum, bsc, polygon)
 * @param tokenSymbol Token symbol (eth, usdt, etc.)
 * @param isTestnet Whether to use testnet address
 * @returns Token address or undefined if not available
 */
export function getTokenAddress(
  network: string,
  tokenSymbol: string,
  isTestnet: boolean = false
): string | undefined {
  const normalizedNetwork = network.toLowerCase();
  const normalizedToken = tokenSymbol.toLowerCase();

  const networkTokens =
    SUPPORTED_TOKENS_BY_NETWORK[
      normalizedNetwork as keyof typeof SUPPORTED_TOKENS_BY_NETWORK
    ];
  if (!networkTokens) return undefined;

  const tokenData =
    networkTokens[normalizedToken as keyof typeof networkTokens];
  if (!tokenData) return undefined;

  return isTestnet ? tokenData.testnet : tokenData.mainnet;
}

/**
 * Get token decimals for a specific network and token
 * @param network Network ID (ethereum, bsc, polygon)
 * @param tokenSymbol Token symbol (eth, usdt, etc.)
 * @returns Token decimals or undefined if not available
 */
export function getTokenDecimals(
  network: string,
  tokenSymbol: string
): number | undefined {
  const normalizedNetwork = network.toLowerCase();
  const normalizedToken = tokenSymbol.toLowerCase();

  const networkTokens =
    SUPPORTED_TOKENS_BY_NETWORK[
      normalizedNetwork as keyof typeof SUPPORTED_TOKENS_BY_NETWORK
    ];
  if (!networkTokens) return undefined;

  const tokenData =
    networkTokens[normalizedToken as keyof typeof networkTokens];
  if (!tokenData) return undefined;

  return tokenData.decimals;
}

/**
 * Check if a token is supported on a specific network
 * @param network Network ID (ethereum, bsc, polygon)
 * @param tokenSymbol Token symbol (eth, usdt, etc.)
 * @returns Boolean indicating if the token is supported
 */
export function isTokenSupported(
  network: string,
  tokenSymbol: string
): boolean {
  const normalizedNetwork = network.toLowerCase();
  const normalizedToken = tokenSymbol.toLowerCase();

  const networkTokens =
    SUPPORTED_TOKENS_BY_NETWORK[
      normalizedNetwork as keyof typeof SUPPORTED_TOKENS_BY_NETWORK
    ];
  if (!networkTokens) return false;

  return normalizedToken in networkTokens;
}

/**
 * Get all supported tokens for a specific network
 * @param network Network ID (ethereum, bsc, polygon)
 * @returns Array of supported token symbols
 */
export function getSupportedTokensForNetwork(network: string): string[] {
  const normalizedNetwork = network.toLowerCase();

  const networkTokens =
    SUPPORTED_TOKENS_BY_NETWORK[
      normalizedNetwork as keyof typeof SUPPORTED_TOKENS_BY_NETWORK
    ];
  if (!networkTokens) return [];

  return Object.keys(networkTokens);
}

/**
 * Get all supported networks
 * @returns Array of supported network IDs
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(NETWORKS);
}

/**
 * Get network logo URL
 * @param network Network ID (ethereum, bsc, polygon)
 * @returns Network logo URL or undefined if not found
 */
export function getNetworkLogoUrl(network: string): string | undefined {
  const normalizedNetwork = network.toLowerCase();
  return NETWORKS[normalizedNetwork as keyof typeof NETWORKS]?.logoUrl;
}

/**
 * Get token info by symbol
 * @param tokenSymbol Token symbol (eth, usdt, etc.)
 * @returns Token info or undefined if not found
 */
export function getTokenInfoBySymbol(
  tokenSymbol: string
): TokenInfo | undefined {
  const normalizedToken = tokenSymbol.toLowerCase();
  return TOKEN_INFO[normalizedToken];
}

/**
 * Get token logo URL by symbol
 * @param tokenSymbol Token symbol (eth, usdt, etc.)
 * @returns Token logo URL or undefined if not found
 */
export function getTokenLogoUrl(tokenSymbol: string): string | undefined {
  const normalizedToken = tokenSymbol.toLowerCase();
  return TOKEN_INFO[normalizedToken]?.logoUrl;
}

/**
 * Normalize CoinGecko token ID for API calls
 * @param token Token symbol or partial ID
 * @returns Normalized CoinGecko ID
 */
export function normalizeTokenId(token: string): string {
  const normalized = token.toLowerCase().trim();

  const tokenInfo = TOKEN_INFO[normalized];
  if (tokenInfo) {
    return tokenInfo.id;
  }

  const tokenMap: Record<string, string> = {
    btc: "bitcoin",
    eth: "ethereum",
    matic: "matic-network",
    bnb: "binancecoin",
  };

  return tokenMap[normalized] || normalized;
}
