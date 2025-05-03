# ZAP Cross-Chain Transfer Service

A TypeScript-based backend service for facilitating cross-chain token transfers between Ethereum/Solana and the Lisk network. This service handles meta-transactions, fee calculations, reserve management, and transaction history tracking.

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [API Reference](#api-reference)
  - [Meta-Transaction API](#meta-transaction-api)
  - [Token Fee API](#token-fee-api)
  - [Reserve Limit API](#reserve-limit-api)
  - [Transaction History API](#transaction-history-api)
  - [IDRX Balance API](#idrx-balance-api)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [License](#license)

## 🔍 Overview

The ZAP Cross-Chain Transfer Service enables seamless token transfers across different blockchains. It allows users to send tokens from Ethereum or Solana and receive IDRX tokens on the Lisk network without requiring users to pay gas fees on Lisk.

The service provides:

- Meta-transactions for gas-free transfers
- Dynamic fee calculations with admin fee + spread fee
- Automatic reserve management
- Complete transaction history tracking
- IDRX token balance checking

## ✨ Features

- **Gas-Free Transfers**: Execute IDRX transfers on behalf of users, removing the need for them to hold Lisk's native token
- **Dynamic Fee Calculation**: Calculate token prices, admin fees (0.5%), and volatility-based spread fees
- **Multi-Currency Support**: Support for Ethereum, Solana, and other major cryptocurrencies
- **Reserve Management**: Dynamically adjust transfer limits based on reserve health
- **Transaction History**: Track and display transaction history across chains
- **Balance Checking**: Query IDRX token balances for any Lisk address
- **Secure Implementation**: Built with robust error handling and comprehensive validation
- **Type-Safe**: Full TypeScript implementation with clear type definitions
- **Clean Architecture**: Follows SOLID principles for maintainability and testability

## 🏗️ Architecture

The service follows a modular, layered architecture:

1. **Controller Layer**: Handles HTTP requests and responses
2. **Service Layer**: Contains business logic and integration with external services
3. **Utility Layer**: Provides helper functions and shared tools
4. **Middleware Layer**: Handles request validation and error processing

Key architectural principles:

- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Injection**: Services and controllers receive dependencies
- **Error Handling**: Centralized, consistent error handling
- **Stateless Design**: No reliance on server-side session state

## 📁 Project Structure

```
zap-cross-chain-service/
├── src/
│   ├── config/                # Configuration settings
│   │   └── config.ts          # Environment and app configuration
│   ├── controllers/           # Request handlers
│   │   ├── metaTransactionController.ts
│   │   ├── tokenFeeController.ts
│   │   ├── reserveLimitController.ts
│   │   ├── transactionHistoryController.ts
│   │   └── idrxBalanceController.ts
│   ├── middleware/            # Express middleware
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── validator.ts       # Request validation
│   ├── services/              # Business logic
│   │   ├── metaTransactionService.ts
│   │   ├── tokenFeeService.ts
│   │   ├── reserveLimitService.ts
│   │   ├── transactionHistoryService.ts
│   │   └── idrxBalanceService.ts
│   ├── types/                 # TypeScript definitions
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   └── blockchain.ts
│   ├── routes/                # API routes
│   │   ├── index.ts
│   │   ├── metaTransactionRoutes.ts
│   │   ├── tokenFeeRoutes.ts
│   │   ├── reserveLimitRoutes.ts
│   │   ├── transactionHistoryRoutes.ts
│   │   └── idrxBalanceRoutes.ts
│   ├── app.ts                 # Express application setup
│   └── server.ts              # Server entry point
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## 🚀 Setup and Installation

### Prerequisites

- Node.js 16.x or higher
- NPM or Yarn
- Access to a Lisk RPC node
- Operator wallet with OPERATOR_ROLE privileges on the IDRXTransferManager contract

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/zap-cross-chain-service.git
   cd zap-cross-chain-service
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration.

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the service:
   ```bash
   npm start
   ```

For development mode:

```bash
npm run dev
```

## 📚 API Reference

### Meta-Transaction API

#### POST /api/meta-transfer

Execute a meta-transaction to transfer IDRX tokens to a recipient.

**Request:**

```json
{
  "recipient": "0x1234567890abcdef1234567890abcdef12345678",
  "idrxAmount": "1000.0"
}
```

**Response:**

```json
{
  "success": true,
  "transferId": "0x8d7f6a56c76d6a6d7a6d8c7d8a7d6a8d7f6a5d6a7d6a8d7f6a5d6a7d6a8d7f",
  "recipient": "0x1234567890abcdef1234567890abcdef12345678",
  "amount": "1000.0",
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

#### GET /api/status

Get the current service status.

**Response:**

```json
{
  "success": true,
  "isActive": true,
  "reserve": "1000000.0",
  "minTransferAmount": "10.0",
  "maxTransferAmount": "100000.0"
}
```

#### GET /api/health

Simple health check endpoint.

**Response:**

```json
{
  "status": "healthy"
}
```

### Token Fee API

#### GET /api/token-price/:token

Get current price data for a token in USD and IDR.

**Parameters:**

- `token` (path): Token name or symbol (optional, defaults to 'ethereum')

**Example:** `/api/token-price/solana`

**Response:**

```json
{
  "success": true,
  "token": "solana",
  "tokenSymbol": "SOL",
  "priceUsd": 142.57,
  "priceIdr": 2209835,
  "timestamp": 1681234567890,
  "priceIdrFormatted": "Rp 2.209.835",
  "priceUsdFormatted": "$142.57"
}
```

#### GET /api/calculate-fees

Calculate admin fee and spread fee for a token amount.

**Parameters:**

- `token` (query): Token name or symbol (optional, defaults to 'ethereum')
- `amount` (query): Amount of the token
- `customSpreadFee` (query): Optional custom spread fee percentage (as decimal, e.g. 0.01 = 1%)

**Example:** `/api/calculate-fees?token=ethereum&amount=1.5`

**Response:**

```json
{
  "success": true,
  "result": {
    "token": "ethereum",
    "tokenSymbol": "ETH",
    "priceUsd": 2835.42,
    "priceIdr": 43949010,
    "adminFeePercentage": 0.005,
    "adminFeeAmount": 0.0075,
    "spreadFeePercentage": 0.002,
    "spreadFeeAmount": 0.003,
    "totalFeePercentage": 0.007,
    "totalFeeAmount": 0.0105,
    "amountBeforeFees": 1.5,
    "amountAfterFees": 1.4895,
    "exchangeRate": 43949010,
    "timestamp": 1681234567890,
    "priceIdrFormatted": "Rp 43.949.010",
    "priceUsdFormatted": "$2,835.42",
    "adminFeePercentageFormatted": "0.50%",
    "spreadFeePercentageFormatted": "0.20%",
    "totalFeePercentageFormatted": "0.70%"
  }
}
```

#### GET /api/calculate-idrx

Calculate IDRX amount from source token.

**Parameters:**

- `token` (query): Source token name or symbol (optional, defaults to 'ethereum')
- `amount` (query): Amount of source token
- `customSpreadFee` (query): Optional custom spread fee percentage

**Example:** `/api/calculate-idrx?token=ethereum&amount=0.5`

**Response:**

```json
{
  "success": true,
  "token": "ethereum",
  "sourceAmount": 0.5,
  "idrxAmount": 21829815.225,
  "idrxAmountFormatted": "Rp 21.829.815",
  "fees": {
    "token": "ethereum",
    "tokenSymbol": "ETH",
    "priceUsd": 2835.42,
    "priceIdr": 43949010,
    "adminFeePercentage": 0.005,
    "adminFeeAmount": 0.0025,
    "spreadFeePercentage": 0.002,
    "spreadFeeAmount": 0.001,
    "totalFeePercentage": 0.007,
    "totalFeeAmount": 0.0035,
    "amountBeforeFees": 0.5,
    "amountAfterFees": 0.4965,
    "exchangeRate": 43949010,
    "timestamp": 1681234567890,
    "adminFeePercentageFormatted": "0.50%",
    "spreadFeePercentageFormatted": "0.20%",
    "totalFeePercentageFormatted": "0.70%"
  }
}
```

#### GET /api/calculate-source

Calculate source token amount needed for a desired IDRX amount.

**Parameters:**

- `token` (query): Source token name or symbol (optional, defaults to 'ethereum')
- `idrxAmount` (query): Desired IDRX amount
- `customSpreadFee` (query): Optional custom spread fee percentage

**Example:** `/api/calculate-source?token=ethereum&idrxAmount=10000000`

**Response:**

```json
{
  "success": true,
  "token": "ethereum",
  "sourceAmount": 0.2285,
  "sourceAmountFormatted": "0.22850000 ETH",
  "idrxAmount": 10000000,
  "idrxAmountFormatted": "Rp 10.000.000",
  "fees": {
    "token": "ethereum",
    "tokenSymbol": "ETH",
    "priceUsd": 2835.42,
    "priceIdr": 43949010,
    "adminFeePercentage": 0.005,
    "adminFeeAmount": 0.00114,
    "spreadFeePercentage": 0.002,
    "spreadFeeAmount": 0.00046,
    "totalFeePercentage": 0.007,
    "totalFeeAmount": 0.0016,
    "amountBeforeFees": 0.2285,
    "amountAfterFees": 0.2269,
    "exchangeRate": 43949010,
    "timestamp": 1681234567890,
    "adminFeePercentageFormatted": "0.50%",
    "spreadFeePercentageFormatted": "0.20%",
    "totalFeePercentageFormatted": "0.70%"
  }
}
```

#### GET /api/volatility/:token

Calculate volatility and recommended spread fee.

**Parameters:**

- `token` (path): Token name or symbol (optional, defaults to 'ethereum')
- `days` (query): Number of days for volatility calculation (1-30, optional, defaults to 1)

**Example:** `/api/volatility/solana?days=7`

**Response:**

```json
{
  "success": true,
  "token": "solana",
  "volatility": 0.02456,
  "recommendedSpreadFee": 0.01428,
  "timeframe": "7 days",
  "timestamp": 1681234567890,
  "volatilityPercentage": "2.46%",
  "recommendedSpreadFeePercentage": "1.43%"
}
```

#### GET /api/supported-tokens

Get list of supported tokens.

**Response:**

```json
{
  "success": true,
  "tokens": [
    { "id": "ethereum", "symbol": "ETH" },
    { "id": "bitcoin", "symbol": "BTC" },
    { "id": "solana", "symbol": "SOL" },
    { "id": "avalanche-2", "symbol": "AVAX" },
    { "id": "binancecoin", "symbol": "BNB" },
    { "id": "matic-network", "symbol": "MATIC" },
    { "id": "polkadot", "symbol": "DOT" },
    { "id": "chainlink", "symbol": "LINK" },
    { "id": "uniswap", "symbol": "UNI" },
    { "id": "cardano", "symbol": "ADA" },
    { "id": "dogecoin", "symbol": "DOGE" },
    { "id": "shiba-inu", "symbol": "SHIB" }
  ]
}
```

### Reserve Limit API

#### GET /api/transfer-limits

Calculate recommended transfer limits based on current reserve pool size.

**Example:** `/api/transfer-limits`

**Response:**

```json
{
  "success": true,
  "reserve": "1000000.0",
  "minTransferAmount": "10.0",
  "recommendedMinAmount": "20.0",
  "maxTransferAmount": "100000.0",
  "recommendedMaxAmount": "20000.0",
  "reserveUtilizationPercentage": "2.00%",
  "healthStatus": "GOOD",
  "recommendations": {
    "message": "Based on the current reserve of 1000000.0 IDRX, we recommend setting transfer limits between 20.0 and 20000.0 IDRX.",
    "healthStatus": "GOOD",
    "healthDescription": "The reserve is in good condition. It can support normal operations with moderate transfer limits."
  }
}
```

#### POST /api/transfer-limits

Update contract transfer limits (requires operator privileges).

**Request:**

```json
{
  "minAmount": "20.0",
  "maxAmount": "20000.0"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transfer limits updated successfully",
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "updatedLimits": {
    "minAmount": "20.0",
    "maxAmount": "20000.0"
  }
}
```

### Transaction History API

#### GET /api/transactions/:address

Get transaction history for a specific address from the Blockscout API.

**Parameters:**

- `address` (path): Ethereum address to get transactions for
- `page` (query): Page number for pagination (optional, defaults to 1)
- `limit` (query): Number of transactions per page (optional, defaults to 20, max 100)
- `filterBy` (query): Filter transactions by direction: `from`, `to`, or `all` (optional, defaults to `all`)
- `sort` (query): Sort transactions by timestamp: `asc` or `desc` (optional, defaults to `desc`)
- `startDate` (query): Filter transactions after this date in ISO format (optional)
- `endDate` (query): Filter transactions before this date in ISO format (optional)

**Example:** `/api/transactions/0x1234567890abcdef1234567890abcdef12345678?limit=10&filterBy=from`

**Response:**

```json
{
  "success": true,
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "transactions": [
    {
      "hash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      "from": "0x1234567890abcdef1234567890abcdef12345678",
      "to": "0xabcdef1234567890abcdef1234567890abcdef12",
      "value": "1000000000000000000",
      "valueInEther": "1",
      "timestamp": 1681234567,
      "formattedDate": "2023-04-11T12:34:56.000Z",
      "status": "success",
      "gasUsed": "21000",
      "gasPrice": "5000000000",
      "blockNumber": 12345678,
      "isContractInteraction": false,
      "functionName": null,
      "methodId": null
    }
    // More transactions...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "hasMore": true
  },
  "summary": {
    "totalTransactions": 10,
    "sentTransactions": 6,
    "receivedTransactions": 4,
    "totalSent": "2.5",
    "totalReceived": "1.2",
    "lastTransaction": "2023-04-11T12:34:56.000Z"
  }
}
```

#### GET /api/transaction/:txHash

Get detailed information about a specific transaction.

**Parameters:**

- `txHash` (path): Transaction hash to look up

**Example:** `/api/transaction/0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba`

**Response:**

```json
{
  "success": true,
  "transaction": {
    "hash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    "from": "0x1234567890abcdef1234567890abcdef12345678",
    "to": "0xabcdef1234567890abcdef1234567890abcdef12",
    "value": "1000000000000000000",
    "valueInEther": "1",
    "timestamp": 1681234567,
    "formattedDate": "2023-04-11T12:34:56.000Z",
    "status": "success",
    "gasUsed": "21000",
    "gasPrice": "5000000000",
    "blockNumber": 12345678,
    "isContractInteraction": false,
    "functionName": null,
    "methodId": null
  }
}
```

### IDRX Balance API

#### GET /api/idrx-balance/:address

Get IDRX token balance for a specific address.

**Parameters:**

- `address` (path): Ethereum-compatible address to check balance for

**Example:** `/api/idrx-balance/0x1234567890abcdef1234567890abcdef12345678`

**Response:**

```json
{
  "success": true,
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "balance": "1000000000000000000000",
  "formattedBalance": "1000.0",
  "tokenSymbol": "IDRX",
  "tokenAddress": "0x0123456789abcdef0123456789abcdef01234568",
  "timestamp": 1681234567890,
  "idrBalanceFormatted": "Rp 1.000"
}
```

#### GET /api/idrx-token-info

Get IDRX token information including name, symbol, and decimals.

**Example:** `/api/idrx-token-info`

**Response:**

```json
{
  "success": true,
  "name": "Indonesian Rupiah Stablecoin",
  "symbol": "IDRX",
  "address": "0x0123456789abcdef0123456789abcdef01234568",
  "decimals": 18
}
```

## 🔒 Security Considerations

1. **Private Key Management**

   - Store private keys securely using environment variables or secrets management
   - Use hardware wallets for production environments
   - Implement key rotation policies

2. **Input Validation**

   - All API endpoints include thorough input validation
   - Prevents injection attacks and unexpected inputs

3. **Rate Limiting**

   - Implement rate limiting to prevent DoS attacks
   - Consider using Redis for distributed rate limiting

4. **Error Handling**

   - Comprehensive error handling to prevent information leakage
   - Structured error responses for better client-side handling

5. **Monitoring**
   - Set up logging for suspicious activities
   - Monitor wallet balances and transaction history
   - Implement alerts for system issues

## 🚢 Deployment

For production deployment, consider:

1. **Container Orchestration**

   - Deploy using Docker and Kubernetes
   - Set up auto-scaling based on demand

2. **Environment Configuration**

   - Use environment-specific configurations
   - Implement secrets management (HashiCorp Vault, AWS Secrets Manager, etc.)

3. **Monitoring and Logging**

   - Implement centralized logging (ELK stack, Datadog, etc.)
   - Set up performance monitoring and alerts

4. **Resilience**

   - Deploy across multiple availability zones
   - Implement circuit breakers for external API calls
   - Set up database backups and redundancy

5. **CI/CD**
   - Automate testing and deployment
   - Implement staging environments for validation

## 📄 License

This project is licensed under the MIT License.
