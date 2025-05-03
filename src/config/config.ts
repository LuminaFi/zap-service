import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  blockchain: {
    liskRpcUrl: process.env.LISK_RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY,
  },
  api: {
    coinmarketcap: {
      apiKey: process.env.COINMARKETCAP_API_KEY,
      baseUrl: "https://pro-api.coinmarketcap.com/v1",
    },
  },
  contractAbi: [
    "function transferIDRX(bytes32 _transferId, address _recipient, uint256 _idrxAmount) external",
    "function minTransferAmount() public view returns (uint256)",
    "function getEffectiveMaxTransferAmount() public view returns (uint256)",
    "function getReserveStatus() external view returns (uint256 reserve, uint256 effectiveMaxAmount, bool isActive)",
  ],

  validateConfig: (): void => {
    const requiredEnvVars = [
      "LISK_RPC_URL",
      "CONTRACT_ADDRESS",
      "OPERATOR_PRIVATE_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
      );
    }

    try {
      new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY as string);
    } catch (error) {
      throw new Error("Invalid OPERATOR_PRIVATE_KEY format");
    }

    if (!ethers.utils.isAddress(process.env.CONTRACT_ADDRESS as string)) {
      throw new Error("Invalid CONTRACT_ADDRESS format");
    }

    if (!process.env.COINMARKETCAP_API_KEY) {
      console.warn(
        "COINMARKETCAP_API_KEY is not set. Token price API calls may fail."
      );
    }
  },
};

export default config;
