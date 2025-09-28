import { 
  getSuiClient, 
  getPackageIds, 
  createTransactionBlock, 
  executeTransactionBlock,
  getObject,
  getEvents,
  getBalance
} from './suiClient.js';

/**
 * Auction Service - Handles all auction-related blockchain operations
 */
export class AuctionService {
  constructor() {
    this.packageIds = getPackageIds();
    this.client = getSuiClient();
  }

  /**
   * Create a new auction
   */
  async createAuction(params) {
    const {
      seller,
      nft,
      minPrice,
      maxPrice,
      durationMs,
      name,
      description,
      signer
    } = params;

    try {
      console.log('Creating auction with params:', { seller, nft, minPrice, maxPrice, durationMs, name, description });
      
      const tx = createTransactionBlock();
      
      // Create auction with NFT escrow
      const [auction] = tx.moveCall({
        target: `${this.packageIds.auction}::Auction::create_auction`,
        arguments: [
          tx.pure.address(seller),
          tx.object(nft), // NFT object to be escrowed - use tx.object() for object references
          tx.pure.u64(minPrice),
          tx.pure.u64(maxPrice),
          tx.pure.u64(durationMs),
          tx.pure.string(name),
          tx.pure.string(description),
        ],
      });

      // Transfer auction to seller
      tx.transferObjects([auction], seller);

      const result = await executeTransactionBlock(tx, signer);
      
      console.log('Auction creation result:', result);
      
      return {
        success: true,
        transactionDigest: result.digest,
        auction: result.objectChanges?.find(
          change => change.type === 'created' && change.objectType?.includes('Auction')
        ),
        events: result.events,
      };
    } catch (error) {
      console.error('Failed to create auction:', error);
      throw new Error(`Failed to create auction: ${error.message}`);
    }
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(params) {
    const {
      auctionId,
      bidder,
      bidAmount,
      bidderCoin,
      signer
    } = params;

    try {
      const tx = createTransactionBlock();
      
      const result = tx.moveCall({
        target: `${this.packageIds.auction}::Auction::place_bid`,
        arguments: [
          tx.object(auctionId),
          tx.pure.address(bidder),
          tx.pure.u64(bidAmount),
          tx.object(bidderCoin),
        ],
      });

      const executionResult = await executeTransactionBlock(tx, signer);
      
      return {
        success: true,
        transactionDigest: executionResult.digest,
        events: executionResult.events,
      };
    } catch (error) {
      console.error('Failed to place bid:', error);
      throw new Error(`Failed to place bid: ${error.message}`);
    }
  }

  /**
   * Check if auction should end
   */
  async checkAuctionEnd(auctionId, clockId) {
    try {
      const tx = createTransactionBlock();
      
      const result = tx.moveCall({
        target: `${this.packageIds.auction}::Auction::check_auction_end`,
        arguments: [
          tx.object(auctionId),
          tx.object(clockId),
        ],
      });

      return result;
    } catch (error) {
      console.error('Failed to check auction end:', error);
      throw new Error(`Failed to check auction end: ${error.message}`);
    }
  }

  /**
   * End an auction and transfer NFT
   */
  async endAuction(params) {
    const {
      auctionId,
      sellerCoin,
      signer
    } = params;

    try {
      const tx = createTransactionBlock();
      
      const [returnedNft] = tx.moveCall({
        target: `${this.packageIds.auction}::Auction::end_auction`,
        arguments: [
          tx.object(auctionId),
          tx.object(sellerCoin),
        ],
      });

      const result = await executeTransactionBlock(tx, signer);
      
      return {
        success: true,
        transactionDigest: result.digest,
        returnedNft,
        events: result.events,
      };
    } catch (error) {
      console.error('Failed to end auction:', error);
      throw new Error(`Failed to end auction: ${error.message}`);
    }
  }

  /**
   * Get auction details
   */
  async getAuctionDetails(auctionId) {
    try {
      const auction = await getObject(auctionId);
      
      if (!auction.data) {
        throw new Error('Auction not found');
      }

      return {
        id: auction.data.objectId,
        type: auction.data.type,
        owner: auction.data.owner,
        content: auction.data.content,
        previousTransaction: auction.data.previousTransaction,
      };
    } catch (error) {
      console.error('Failed to get auction details:', error);
      throw new Error(`Failed to get auction details: ${error.message}`);
    }
  }

  /**
   * Get current ceiling price
   */
  async getCurrentCeiling(auctionId, clockId) {
    try {
      const tx = createTransactionBlock();
      
      const result = tx.moveCall({
        target: `${this.packageIds.auction}::Auction::get_current_ceiling`,
        arguments: [
          tx.object(auctionId),
          tx.object(clockId),
        ],
      });

      return result;
    } catch (error) {
      console.error('Failed to get current ceiling:', error);
      throw new Error(`Failed to get current ceiling: ${error.message}`);
    }
  }

  /**
   * Get auction events
   */
  async getAuctionEvents(auctionId, limit = 50) {
    try {
      const events = await getEvents(
        `${this.packageIds.auction}::Auction::CreateAuctionEvent`,
        { limit }
      );

      return events.filter(event => 
        event.parsedJson?.id === auctionId
      );
    } catch (error) {
      console.error('Failed to get auction events:', error);
      throw new Error(`Failed to get auction events: ${error.message}`);
    }
  }

  /**
   * Get all auctions
   */
  async getAllAuctions() {
    try {
      // Get all CreateAuctionEvent events to find all auctions
      const events = await getEvents(
        `${this.packageIds.auction}::Auction::CreateAuctionEvent`,
        { limit: 100 }
      );

      // Convert events to auction objects
      const auctions = [];
      for (const event of events) {
        try {
          const auctionId = event.parsedJson?.id;
          if (auctionId) {
            const auctionDetails = await this.getAuctionDetails(auctionId);
            auctions.push(auctionDetails);
          }
        } catch (error) {
          console.warn(`Failed to get details for auction ${event.parsedJson?.id}:`, error);
          // Continue with other auctions
        }
      }

      return auctions;
    } catch (error) {
      console.error('Failed to get all auctions:', error);
      throw new Error(`Failed to get all auctions: ${error.message}`);
    }
  }

  /**
   * Get all auctions created by a seller
   */
  async getSellerAuctions(sellerAddress) {
    try {
      const objects = await this.client.getObjectsOwnedByAddress({
        address: sellerAddress,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      return objects.filter(obj => 
        obj.type?.includes('Auction')
      );
    } catch (error) {
      console.error('Failed to get seller auctions:', error);
      throw new Error(`Failed to get seller auctions: ${error.message}`);
    }
  }

  /**
   * Get auction history
   */
  async getAuctionHistory(auctionId) {
    try {
      const events = await getEvents(
        `${this.packageIds.auction}::Auction::UpdateAuctionEvent`,
        { limit: 100 }
      );

      return events.filter(event => 
        event.parsedJson?.id === auctionId
      );
    } catch (error) {
      console.error('Failed to get auction history:', error);
      throw new Error(`Failed to get auction history: ${error.message}`);
    }
  }

  /**
   * Get NFT from auction
   */
  async getAuctionNFT(auctionId) {
    try {
      const auction = await this.getAuctionDetails(auctionId);
      
      if (!auction.content?.fields?.escrowed_nft) {
        throw new Error('No NFT found in auction');
      }

      return auction.content.fields.escrowed_nft;
    } catch (error) {
      console.error('Failed to get auction NFT:', error);
      throw new Error(`Failed to get auction NFT: ${error.message}`);
    }
  }

  /**
   * Validate auction parameters
   */
  validateAuctionParams(params) {
    const { minPrice, maxPrice, durationMs, name, description } = params;
    
    if (!minPrice || minPrice <= 0) {
      throw new Error('Invalid minimum price');
    }
    
    if (!maxPrice || maxPrice <= minPrice) {
      throw new Error('Maximum price must be greater than minimum price');
    }
    
    if (!durationMs || durationMs <= 0) {
      throw new Error('Invalid duration');
    }
    
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }
    
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }
    
    return true;
  }
}
