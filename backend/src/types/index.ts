// Backend-specific types and shared types
import { Request } from 'express';
import { Socket } from 'socket.io';

// Shared types (same as frontend for consistency)
export interface SuiObjectData {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: {
    AddressOwner: string;
  };
  previousTransaction: string;
  content: {
    dataType: 'moveObject' | 'package';
    type: string;
    fields: Record<string, any>;
  };
}

export interface SuiTransactionResult {
  digest: string;
  effects: any;
  events: SuiEvent[];
  objectChanges: SuiObjectChange[];
}

export interface SuiEvent {
  id: {
    txDigest: string;
    eventSeq: string;
  };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson: Record<string, any>;
  timestampMs: string;
}

export interface SuiObjectChange {
  type: 'created' | 'mutated' | 'deleted';
  sender: string;
  owner: {
    AddressOwner: string;
  };
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
}

export interface Auction {
  id: string;
  minVal: number;
  maxVal: number;
  initialMaxVal: number;
  currentBidderId?: string;
  currentBidAmount: number;
  sellerId: string;
  startTime: number;
  deadLine: number;
  name: string;
  description: string;
  ended: boolean;
  escrowedNft: string;
}

export interface CreateAuctionRequest {
  seller: string;
  nft: string;
  minPrice: number;
  maxPrice: number;
  durationMs: number;
  name: string;
  description: string;
  signer: string;
}

export interface PlaceBidRequest {
  bidder: string;
  bidAmount: number;
  bidderCoin: string;
  signer: string;
}

export interface EndAuctionRequest {
  sellerCoin: string;
  signer: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  createdAuctions: string[];
  totalSales: number;
  reputation: number;
  sellerCoin: string;
}

export interface CreateSellerRequest {
  name: string;
  coin: string;
  signer: string;
}

export interface BidderProfile {
  id: string;
  name: string;
  participatedAuctions: string[];
  bidHistory: BidHistory[];
  totalWins: number;
  totalSpent: number;
}

export interface BidHistory {
  auctionId: string;
  bidAmount: number;
  timestamp: number;
  won: boolean;
}

export interface CreateBidderRequest {
  name: string;
  signer: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  createdAt: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface CreateNFTRequest {
  name: string;
  description: string;
  imageUrl: string;
  signer: string;
}

export interface TransferNFTRequest {
  recipient: string;
  signer: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WebSocketMessage {
  type: string;
  timestamp: number;
  data?: any;
}

export interface AuctionUpdateMessage extends WebSocketMessage {
  type: 'auction_update' | 'bid_update' | 'auction_ended' | 'new_auction';
  auctionId: string;
}

export interface BidUpdateMessage extends WebSocketMessage {
  type: 'bid_update';
  auctionId: string;
  bidAmount: number;
  bidder: string;
}

export interface AuctionEndedMessage extends WebSocketMessage {
  type: 'auction_ended';
  auctionId: string;
  winner?: string;
  finalPrice: number;
}

export interface PackageIds {
  auction: string;
  seller: string;
  bidder: string;
}

export interface SuiServiceConfig {
  network: string;
  rpcUrl: string;
  packageIds: PackageIds;
}

export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  SUI_NETWORK: string;
  SUI_RPC_URL: string;
  SUI_FAUCET_URL?: string;
  AUCTION_PACKAGE_ID: string;
  SELLER_PACKAGE_ID: string;
  BIDDER_PACKAGE_ID: string;
  REDIS_URL?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
}

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface HealthCheckData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  environment: string;
  services: {
    sui?: {
      status: 'healthy' | 'unhealthy';
      network: string;
      apiVersion?: string;
      rpcUrl: string;
      error?: string;
    };
    contracts?: {
      status: 'healthy' | 'warning';
      packageIds: PackageIds;
      configured: boolean;
      message?: string;
    };
    filesystem?: {
      status: 'healthy' | 'unhealthy';
      uploadPath: string;
      error?: string;
    };
  };
}

export interface SystemMetrics {
  timestamp: string;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    platform: string;
    nodeVersion: string;
    pid: number;
  };
  environment: {
    nodeEnv: string;
    port: number;
    suiNetwork: string;
  };
}

// Express Request Extensions
export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
    type: 'seller' | 'bidder';
  };
}

export interface PaginationRequest extends Request {
  pagination: {
    page: number;
    limit: number;
    offset: number;
  };
}

// Socket.IO Extensions
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'seller' | 'bidder';
}

// Service Types
export interface PackageIds {
  auction: string;
  seller: string;
  bidder: string;
}

export interface SuiServiceConfig {
  network: string;
  rpcUrl: string;
  packageIds: PackageIds;
}

// Environment Variables
export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  SUI_NETWORK: string;
  SUI_RPC_URL: string;
  SUI_FAUCET_URL?: string;
  AUCTION_PACKAGE_ID: string;
  SELLER_PACKAGE_ID: string;
  BIDDER_PACKAGE_ID: string;
  REDIS_URL?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Health Check Types
export interface HealthCheckData {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  environment: string;
  services: {
    sui?: {
      status: 'healthy' | 'unhealthy';
      network: string;
      apiVersion?: string;
      rpcUrl: string;
      error?: string;
    };
    contracts?: {
      status: 'healthy' | 'warning';
      packageIds: PackageIds;
      configured: boolean;
      message?: string;
    };
    filesystem?: {
      status: 'healthy' | 'unhealthy';
      uploadPath: string;
      error?: string;
    };
  };
}

export interface SystemMetrics {
  timestamp: string;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    platform: string;
    nodeVersion: string;
    pid: number;
  };
  environment: {
    nodeEnv: string;
    port: number;
    suiNetwork: string;
  };
}
