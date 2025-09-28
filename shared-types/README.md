# @bidsui/shared-types

Shared TypeScript types for the BidSui project, used by both frontend and backend to ensure type consistency across the entire application.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### In Backend (Node.js)

```typescript
import { CreateAuctionRequest, Auction, ApiResponse } from '@bidsui/shared-types';
```

### In Frontend (Next.js)

```typescript
import { CreateAuctionRequest, Auction, ApiResponse } from '@bidsui/shared-types';
```

## Types Included

- **Sui Types**: SuiObjectData, SuiTransactionResult, SuiEvent, etc.
- **Auction Types**: Auction, CreateAuctionRequest, PlaceBidRequest, etc.
- **NFT Types**: NFTMetadata, CreateNFTRequest, TransferNFTRequest, etc.
- **API Types**: ApiResponse, PaginatedResponse, etc.
- **WebSocket Types**: WebSocketMessage, AuctionUpdateMessage, etc.
- **Service Types**: PackageIds, SuiServiceConfig, etc.
- **Error Types**: AppError, ValidationError, etc.

## Benefits

- ✅ **No Type Duplication**: Single source of truth for all types
- ✅ **Type Safety**: Consistent types across frontend and backend
- ✅ **Easy Maintenance**: Update types in one place
- ✅ **Better DX**: Better IntelliSense and error detection
- ✅ **Contract Alignment**: Types match smart contract interfaces exactly
