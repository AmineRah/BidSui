// API service for BidSui backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Shared types (imported from shared-types package)
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

export interface CreateNFTRequest {
  name: string;
  description: string;
  imageUrl: string;
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

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface CreateSellerRequest {
  name: string;
  coin: string;
  signer: string;
}

export interface CreateBidderRequest {
  name: string;
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

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // NFT Endpoints
  async createNFT(formData: FormData): Promise<ApiResponse<{ objectId: string }>> {
    try {
      console.log('Creating NFT with URL:', `${this.baseURL}/api/nfts/mint`);
      console.log('FormData contents:', Array.from(formData.entries()));
      
      const response = await fetch(`${this.baseURL}/api/nfts/mint`, {
        method: 'POST',
        body: formData,
      });

      console.log('NFT creation response status:', response.status);
      console.log('NFT creation response headers:', response.headers);

      // Vérifier si la réponse est OK
      if (!response.ok) {
        // Essayer de parser la réponse d'erreur
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('NFT creation error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.log('Failed to parse error response:', parseError);
          // Si on ne peut pas parser le JSON, utiliser le message par défaut
        }
        
        // Retourner une réponse d'erreur sans lancer d'exception
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Parser la réponse de succès
      const data = await response.json();
      console.log('NFT creation success response:', data);
      return {
        success: true,
        data: data.data, // Extract the actual data from the response
      };
    } catch (error) {
      // Log l'erreur pour le debugging mais ne pas la propager
      console.error('Create NFT failed:', error);
      
      // Retourner une réponse d'erreur générique
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getNFT(nftId: string): Promise<ApiResponse<NFTMetadata>> {
    return this.request(`/api/nfts/${nftId}`);
  }

  // Auction Endpoints
  async createAuction(auctionData: CreateAuctionRequest): Promise<ApiResponse<{ auction: Auction }>> {
    console.log('Creating auction with URL:', `${this.baseURL}/api/auctions`);
    console.log('Auction data:', auctionData);
    
    try {
      const response = await fetch(`${this.baseURL}/api/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auctionData),
      });

      console.log('Auction creation response status:', response.status);
      console.log('Auction creation response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Auction creation error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.log('Failed to parse error response:', parseError);
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      console.log('Auction creation success response:', data);
      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Create auction failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getAuctions(): Promise<ApiResponse<Auction[]>> {
    return this.request('/api/auctions');
  }

  async getAuction(auctionId: string): Promise<ApiResponse<Auction>> {
    return this.request(`/api/auctions/${auctionId}`);
  }

  async placeBid(auctionId: string, bidData: PlaceBidRequest): Promise<ApiResponse<any>> {
    return this.request(`/api/auctions/${auctionId}/bid`, {
      method: 'POST',
      body: JSON.stringify(bidData),
    });
  }

  async endAuction(auctionId: string, endData: EndAuctionRequest): Promise<ApiResponse<any>> {
    return this.request(`/api/auctions/${auctionId}/end`, {
      method: 'POST',
      body: JSON.stringify(endData),
    });
  }

  // Seller Endpoints
  async createSeller(sellerData: CreateSellerRequest): Promise<ApiResponse<SellerProfile>> {
    return this.request('/api/sellers', {
      method: 'POST',
      body: JSON.stringify(sellerData),
    });
  }

  async getSeller(address: string): Promise<ApiResponse<SellerProfile>> {
    return this.request(`/api/sellers/${address}`);
  }

  // Bidder Endpoints
  async createBidder(bidderData: CreateBidderRequest): Promise<ApiResponse<BidderProfile>> {
    return this.request('/api/bidders', {
      method: 'POST',
      body: JSON.stringify(bidderData),
    });
  }

  async getBidder(address: string): Promise<ApiResponse<BidderProfile>> {
    return this.request(`/api/bidders/${address}`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/health');
  }
}

export const apiService = new ApiService();
export default apiService;
