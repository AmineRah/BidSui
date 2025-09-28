# BidSui Backend API

Backend API server for the BidSui auction platform, built with **TypeScript**, Node.js and Express. This server provides RESTful APIs and WebSocket support for interacting with Sui blockchain smart contracts with full type safety.

## Features

- 🚀 **RESTful API** for auction management
- 🔗 **Sui Blockchain Integration** with smart contracts
- ⚡ **WebSocket Support** for real-time updates
- 🛡️ **Security Middleware** (Helmet, CORS, Rate Limiting)
- 📝 **Request Logging** and error handling
- 🔍 **Input Validation** with Joi
- 📊 **Health Monitoring** endpoints
- 🔒 **Type Safety** with TypeScript
- 🧪 **Comprehensive Testing** with Jest

## Quick Start

### Prerequisites

- Node.js >= 18.12.0
- npm or pnpm
- TypeScript >= 5.3.0
- Sui blockchain access (devnet/testnet/mainnet)

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Sui Network Configuration
SUI_NETWORK=devnet
SUI_RPC_URL=https://fullnode.devnet.sui.io:443

# Smart Contract Package IDs (replace with your deployed package IDs)
AUCTION_PACKAGE_ID=0xYOUR_AUCTION_PACKAGE_ID
SELLER_PACKAGE_ID=0xYOUR_SELLER_PACKAGE_ID
BIDDER_PACKAGE_ID=0xYOUR_BIDDER_PACKAGE_ID

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

### TypeScript Development

The backend is fully typed with TypeScript for better development experience:

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Run tests
npm test
```

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/sui` - Sui network health
- `GET /api/health/detailed` - Detailed system health
- `GET /api/health/metrics` - System metrics

### Auctions
- `POST /api/auctions` - Create new auction
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions/:id/bid` - Place bid on auction
- `POST /api/auctions/:id/end` - End auction
- `GET /api/auctions/:id/events` - Get auction events
- `GET /api/auctions/:id/history` - Get bidding history
- `GET /api/auctions/:id/ceiling` - Get current ceiling price
- `GET /api/auctions/:id/nft` - Get NFT from auction
- `GET /api/auctions/seller/:address` - Get seller's auctions

### Sellers
- `POST /api/sellers` - Create seller profile
- `GET /api/sellers/:address/profile` - Get seller profile
- `GET /api/sellers/:address/auctions` - Get seller's auctions
- `GET /api/sellers/:address/stats` - Get seller statistics
- `GET /api/sellers/:address/balance` - Get seller balance

### Bidders
- `POST /api/bidders` - Create bidder profile
- `GET /api/bidders/:address/profile` - Get bidder profile
- `GET /api/bidders/:address/bids` - Get bid history
- `GET /api/bidders/:address/stats` - Get bidder statistics
- `GET /api/bidders/:address/balance` - Get balance
- `GET /api/bidders/:address/active-bids` - Get active bids

### NFTs
- `POST /api/nfts/upload` - Upload NFT metadata
- `GET /api/nfts/:id` - Get NFT details
- `GET /api/nfts/owner/:address` - Get owned NFTs
- `POST /api/nfts/create` - Create new NFT
- `POST /api/nfts/:id/transfer` - Transfer NFT
- `GET /api/nfts/:id/metadata` - Get NFT metadata
- `GET /api/nfts/search` - Search NFTs

## WebSocket Events

### Client Events
- `join_auction` - Join auction room for real-time updates
- `leave_auction` - Leave auction room
- `bid_placed` - Notify new bid placed
- `auction_created` - Notify auction created

### Server Events
- `auction_update` - Auction state update
- `bid_update` - New bid notification
- `new_auction` - New auction created
- `auction_ended` - Auction ended notification
- `periodic_check` - Periodic auction status check

## Example Usage

### Create an Auction

```javascript
const response = await fetch('http://localhost:3001/api/auctions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    seller: '0x...',
    nft: '0x...',
    minPrice: 1000000000, // 1 SUI in MIST
    maxPrice: 10000000000, // 10 SUI in MIST
    durationMs: 3600000, // 1 hour
    name: 'My Awesome NFT',
    description: 'This is an amazing NFT',
    signer: '0x...'
  })
});
```

### Place a Bid

```javascript
const response = await fetch('http://localhost:3001/api/auctions/0x.../bid', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bidder: '0x...',
    bidAmount: 5000000000, // 5 SUI in MIST
    bidderCoin: '0x...',
    signer: '0x...'
  })
});
```

### WebSocket Connection

```javascript
const socket = io('http://localhost:3001');

// Join auction room
socket.emit('join_auction', '0xAUCTION_ID');

// Listen for updates
socket.on('bid_update', (data) => {
  console.log('New bid:', data);
});

socket.on('auction_ended', (data) => {
  console.log('Auction ended:', data);
});
```

## Smart Contract Integration

The backend integrates with your Sui smart contracts:

- **Auction.move** - Main auction logic with NFT escrow
- **Seller.move** - Seller profile management
- **Bidder.move** - Bidder profile and history

Make sure to update the package IDs in your `.env` file after deploying your contracts.

## Development

### Scripts
- `npm run dev` - Start development server with tsx watch
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests with Jest
- `npm run type-check` - Type checking without compilation
- `npm run clean` - Clean build directory

### Project Structure
```
backend/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── routes/          # API route handlers (.ts)
│   ├── services/        # Business logic and Sui integration (.ts)
│   ├── middleware/      # Express middleware (.ts)
│   ├── __tests__/       # Test files
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript output
├── package.json
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest testing configuration
├── env.example
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `SUI_NETWORK` | Sui network | devnet |
| `SUI_RPC_URL` | Sui RPC endpoint | - |
| `AUCTION_PACKAGE_ID` | Auction contract package ID | - |
| `SELLER_PACKAGE_ID` | Seller contract package ID | - |
| `BIDDER_PACKAGE_ID` | Bidder contract package ID | - |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |

## Security

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** to prevent abuse
- **Input validation** with Joi
- **Request logging** for monitoring

## Monitoring

- Health check endpoints for monitoring
- Request/response logging
- Error tracking and reporting
- System metrics endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
