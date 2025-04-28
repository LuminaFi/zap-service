# ZAP Cross-Chain Meta-Transaction Service

A TypeScript-based backend service for handling cross-chain transfers between Ethereum/Solana and the Lisk network. This service allows users to transfer IDRX tokens without paying gas fees by implementing a meta-transaction pattern.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [Meta-Transaction API](#meta-transaction-api)
  - [Spread Fee API](#spread-fee-api)
  - [Reserve Limit API](#reserve-limit-api)
  - [Transaction History API](#transaction-history-api)
- [Architecture](#architecture)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

The ZAP Cross-Chain Meta-Transaction Service facilitates seamless token transfers across different blockchains. It allows users to send tokens from Ethereum or Solana and receive IDRX tokens on the Lisk network without requiring users to pay gas fees in Lisk's native currency.

The service acts as a bridge that:
1. Executes IDRX transfers on behalf of users (meta-transactions)
2. Calculates optimal spread fees based on market volatility
3. Manages reserve limits based on liquidity
4. Tracks transaction history across chains

## Features

- **Gas-Free Transfers**: Users don't need Lisk tokens for gas fees
- **Dynamic Spread Fees**: Automatically adjusts fees based on market volatility
- **Adaptive Reserve Limits**: Calculates optimal transfer limits based on reserves
- **Transaction History**: Retrieves and displays complete transaction history
- **Type Safety**: Built with TypeScript and comprehensive type definitions
- **Clean Architecture**: Follows SOLID principles with separation of concerns
- **Error Handling**: Robust error handling and validation
- **API Documentation**: Comprehensive API documentation

## Project Structure

```
zap-meta-transaction-service/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── routes/           # API routes
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── .env.example          # Example environment variables
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- NPM or Yarn
- Access to a Lisk RPC node
- Operator wallet with sufficient funds and OPERATOR_ROLE on the contract

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zap-meta-transaction-service.git
   cd zap-meta-transaction-service
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

For development:
```bash
npm run dev
```

## API Reference

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

### Spread Fee API

#### GET /api/spread-fee/:token
Calculate spread fee for a specific token based on market volatility.

**Parameters:**
- `token` (path): Token name or symbol (optional, defaults to 'ethereum')
- `days` (query): Number of days for volatility calculation (1-30, optional, defaults to 1)

**Example:** `/api/spread-fee/solana?days=7`

**Response:**
```json
{
  "success": true,
  "token": "solana",
  "volatility": 0.02456,
  "recommendedSpreadFee": 0.01343,
  "volatilityPercentage": "2.46%",
  "spreadFeePercentage": "1.34%",
  "timeframe": "7 days",
  "timestamp": 1681234567890
}
```

#### GET /api/market-volatility
Get volatility and recommended spread fees for multiple tokens.

**Parameters:**
- `tokens` (query): Comma-separated list of tokens (optional, defaults to 'ethereum,solana')
- `days` (query): Number of days for volatility calculation (1-30, optional, defaults to 1)

**Example:** `/api/market-volatility?tokens=ethereum,solana,bitcoin&days=3`

**Response:**
```json
{
  "success": true,
  "tokens": {
    "ethereum": {
      "token": "ethereum",
      "volatility": 0.0189,
      "recommendedSpreadFee": 0.01045,
      "volatilityPercentage": "1.89%",
      "spreadFeePercentage": "1.05%",
      "timeframe": "3 days",
      "timestamp": 1681234567890
    },
    "solana": {
      "token": "solana",
      "volatility": 0.0256,
      "recommendedSpreadFee": 0.0138,
      "volatilityPercentage": "2.56%",
      "spreadFeePercentage": "1.38%",
      "timeframe": "3 days",
      "timestamp": 1681234567890
    },
    "bitcoin": {
      "token": "bitcoin",
      "volatility": 0.0142,
      "recommendedSpreadFee": 0.0081,
      "volatilityPercentage": "1.42%",
      "spreadFeePercentage": "0.81%",
      "timeframe": "3 days",
      "timestamp": 1681234567890
    }
  }
}
```

#### GET /api/average-spread-fee
Calculate average volatility and recommended spread fee across multiple tokens.

**Parameters:**
- `tokens` (query): Comma-separated list of tokens (optional, defaults to 'ethereum,solana')
- `days` (query): Number of days for volatility calculation (1-30, optional, defaults to 1)

**Example:** `/api/average-spread-fee?tokens=ethereum,solana,bitcoin`

**Response:**
```json
{
  "success": true,
  "tokens": ["ethereum", "solana", "bitcoin"],
  "averageVolatility": 0.0196,
  "recommendedSpreadFee": 0.0108,
  "averageVolatilityPercentage": "1.96%",
  "recommendedSpreadFeePercentage": "1.08%",
  "timeframe": "1 day",
  "timestamp": 1681234567890
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
    },
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

## Architecture

The service follows a clean architecture approach with four main layers:

1. **API Layer**: Express routes and controllers
2. **Service Layer**: Business logic and domain services
3. **Utility Layer**: Helper functions and shared utilities
4. **Configuration Layer**: Environment and app configuration

Key principles:
- **Separation of Concerns**: Each component has a single responsibility
- **Dependency Injection**: Components receive their dependencies
- **Error Handling**: Centralized error handling with custom error types
- **Type Safety**: Comprehensive TypeScript definitions
- **Middleware Pattern**: Express middleware for validation and error handling

## Security Considerations

1. **Private Key Management**
   - Store private keys securely using environment variables
   - Consider using a hardware wallet or secrets manager in production
   - The operator account should have minimal privileges

2. **Input Validation**
   - All API endpoints perform thorough input validation
   - Uses express-validator for request validation
   - Input sanitization to prevent injection attacks

3. **Rate Limiting**
   - Implement rate limiting in production to prevent abuse
   - Consider using Redis for distributed rate limiting

4. **Monitoring and Alerts**
   - Set up logging and monitoring for suspicious activities
   - Configure alerts for operator wallet balance thresholds
   - Monitor for failed transactions and errors

## Deployment

For production deployment, consider:

1. **Containerization**
   - Use Docker to containerize the application
   - Deploy with Kubernetes for scaling and resilience

2. **Environment Setup**
   - Use production-grade secrets management
   - Set up proper logging and monitoring
   - Configure automated backups

3. **CI/CD Pipeline**
   - Implement automated testing
   - Set up continuous deployment
   - Configure staging environments

4. **High Availability**
   - Deploy multiple instances
   - Use load balancing
   - Implement automatic failover

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.