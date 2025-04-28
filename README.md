### Reserve Limit Endpoints

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

## Integration Guide

To integrate this service with your frontend and blockchain monitoring system:

1. **Monitor Source Chain**

   - Monitor for incoming ETH/SOL transactions to your deposit address
   - When a transaction is detected, extract the sender and amount

2. **Call Meta-Transaction Service**

   - After confirming receipt of source tokens, call the `/api/meta-transfer` endpoint
   - Provide the recipient address and the IDRX amount to be transferred

3. **Handle Response**

   - Process the meta-transaction response
   - Store the transaction hash and transfer ID for reference

4. **Check Status**
   - Use the `/api/status` endpoint to check if the service is active
   - Verify transfer limits before attempting transfers

## Security Considerations

1. **Private Key Management**

   - NEVER commit your private key to version control
   - Consider using a hardware wallet or secure key management solution in production
   - Use an operator account with limited funds, only what's needed for gas fees

2. **Rate Limiting**

   - Implement rate limiting in production to prevent DoS attacks
   - Consider using a library like `express-rate-limit`

3. **Error Handling**
   - All errors are properly handled and return appropriate HTTP status codes
   - Client errors (400 range) indicate issues with the request
   - Server errors (500 range) indicate issues with the service

## Deployment

For production deployment, consider:

1. **Containerization**

   - Use Docker to containerize the application
   - Deploy using Kubernetes for scalability and reliability

2. **Monitoring**

   - Implement logging with Winston or similar
   - Set up alerts for service disruptions
   - Monitor the operator wallet balance

3. **Security**
   - Use SSL/TLS for all communications
   - Implement API authentication for production
   - Keep dependencies updated

## License

MIT

# ZAP Meta-Transaction Service

A TypeScript-based backend service that handles meta-transactions for the IDRXTransferManager smart contract. This service allows users to transfer IDRX tokens on the Lisk network without paying gas fees.

## Features

- **Gas-Free Transfers**: Users don't need native Lisk tokens for gas
- **Secure Implementation**: TypeScript with strict type checking
- **Well-Structured Codebase**: Following best practices for maintainability
- **Error Handling**: Comprehensive error handling and validation

## Project Structure

```
zap-meta-transaction-service/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # API route handlers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── routes/          # API routes
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example         # Example environment variables
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- NPM or Yarn
- Access to a Lisk RPC node
- Operator wallet with OPERATOR_ROLE privileges on the IDRXTransferManager contract

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

   Edit `.env` with your configuration.

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

## API Endpoints

### Meta-Transaction Endpoints

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

### Spread Fee Endpoints

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
