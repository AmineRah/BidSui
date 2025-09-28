# BidSui - Decentralized Auction Platform

BidSui is a decentralized auction platform built on Sui blockchain, featuring hybrid (Dutch) auctions with NFT escrow functionality.

## 🌟 Features

- 🏛️ **Hybrid Auction System** - Dutch auction with decreasing ceiling prices
- 🖼️ **NFT Integration** - Automatic NFT escrow during auctions
- ⚡ **Real-time Updates** - WebSocket support for live bidding
- 🔐 **Secure** - Smart contract escrow and automatic transfers
- 📱 **Modern UI** - React frontend with Tailwind CSS
- 🚀 **Scalable Backend** - Node.js API with Sui blockchain integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  Sui Blockchain │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Move)        │
│                 │    │                 │    │                 │
│ • React UI      │    │ • REST API      │    │ • Smart         │
│ • WebSocket     │    │ • WebSocket     │    │   Contracts     │
│ • Wallet Conn.  │    │ • Validation    │    │ • NFT Escrow    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.12.0
- pnpm >= 8.0.0
- Sui CLI (for smart contract deployment)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd BidSui
```

2. **Start everything with one command:**
```bash
./start.sh
```

This will automatically:
- Install dependencies for both frontend and backend
- Start the backend API server (port 3001)
- Start the frontend development server (port 3000)

### Manual Setup

If you prefer to set up each part manually:

#### 1. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

#### 3. Deploy Smart Contracts
```bash
# Configure Sui CLI first
sui client new-address ed25519
sui client switch --address <your-address>

# Deploy contracts
./scripts/deploy-contracts.sh
```

## 📁 Project Structure

```
BidSui/
├── frontend/                 # Next.js React frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   └── package.json
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── server.js       # Main server file
│   └── package.json
├── move/                   # Sui smart contracts
│   ├── sources/
│   │   ├── Auction.move    # Main auction logic
│   │   ├── Seller.move     # Seller management
│   │   └── Bidder.move     # Bidder management
│   └── Move.toml
├── scripts/                # Deployment scripts
│   └── deploy-contracts.sh
├── start.sh               # Project startup script
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
SUI_NETWORK=devnet
SUI_RPC_URL=https://fullnode.devnet.sui.io:443
AUCTION_PACKAGE_ID=0xYOUR_PACKAGE_ID
SELLER_PACKAGE_ID=0xYOUR_PACKAGE_ID
BIDDER_PACKAGE_ID=0xYOUR_PACKAGE_ID
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (constants.ts)
```typescript
export const DEVNET_AUCTION_PACKAGE_ID = "0xYOUR_PACKAGE_ID";
export const TESTNET_AUCTION_PACKAGE_ID = "0xYOUR_PACKAGE_ID";
export const MAINNET_AUCTION_PACKAGE_ID = "0xYOUR_PACKAGE_ID";
```

## 🎯 How It Works

### 1. Auction Creation
- Seller creates an auction with an NFT
- NFT is automatically placed in escrow
- Auction parameters: min price, max price, duration

### 2. Bidding Process
- Bidders place bids below the current ceiling price
- Ceiling price decreases over time (Dutch auction)
- Highest bidder wins when ceiling reaches their bid

### 3. Auction End
- NFT is automatically transferred to the winner
- Payment is sent to the seller
- If no winner, NFT is returned to seller

## 🔌 API Endpoints

### Auctions
- `POST /api/auctions` - Create auction
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions/:id/bid` - Place bid
- `POST /api/auctions/:id/end` - End auction

### Users
- `POST /api/sellers` - Create seller profile
- `POST /api/bidders` - Create bidder profile
- `GET /api/sellers/:address/stats` - Seller statistics
- `GET /api/bidders/:address/stats` - Bidder statistics

### NFTs
- `POST /api/nfts/upload` - Upload NFT metadata
- `GET /api/nfts/owner/:address` - Get owned NFTs
- `POST /api/nfts/:id/transfer` - Transfer NFT

## 🌐 WebSocket Events

### Client Events
- `join_auction` - Join auction room
- `leave_auction` - Leave auction room
- `bid_placed` - Notify new bid

### Server Events
- `auction_update` - Auction state change
- `bid_update` - New bid notification
- `auction_ended` - Auction completion

## 🧪 Smart Contracts

### Auction.move
- Hybrid auction logic with decreasing ceiling
- NFT escrow functionality
- Automatic winner determination

### Seller.move
- Seller profile management
- Auction creation
- Sales tracking

### Bidder.move
- Bidder profile management
- Bid history tracking
- Statistics and analytics

## 🚀 Deployment

### Development
```bash
./start.sh
```

### Production with Docker
```bash
cd backend
docker-compose up -d
```

### Smart Contract Deployment
```bash
./scripts/deploy-contracts.sh
```

## 🛠️ Development

### Adding New Features

1. **Smart Contracts**: Add new Move modules in `move/sources/`
2. **Backend**: Add new routes in `backend/src/routes/`
3. **Frontend**: Add new components in `frontend/components/`

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && pnpm test
```

## 📚 Documentation

- [Backend API Documentation](./backend/README.md)
- [Smart Contract Documentation](./move/sources/)
- [Frontend Components](./frontend/components/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Create an issue for bug reports
- Join our community discussions
- Check the documentation

## 🎉 Acknowledgments

- Sui blockchain for the underlying infrastructure
- Next.js and React for the frontend framework
- Express.js for the backend API
- All contributors and supporters

---

**Built with ❤️ on Sui blockchain**
