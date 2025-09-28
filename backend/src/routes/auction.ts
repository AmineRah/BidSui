import express, { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AuctionService } from '../services/auctionService.js';
import { validateAuctionParams, validateBidParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { notifyNewBid, notifyAuctionCreated, notifyAuctionEnded } from '../services/websocket.js';
import { 
  CreateAuctionRequest, 
  PlaceBidRequest, 
  EndAuctionRequest, 
  ApiResponse 
} from '../types/index.js';

const router: Router = express.Router();
const auctionService = new AuctionService();

/**
 * @route   POST /api/auctions
 * @desc    Create a new auction
 * @access  Public
 */
router.post('/', 
  validateAuctionParams,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      seller,
      nft,
      minPrice,
      maxPrice,
      durationMs,
      name,
      description,
      signer
    }: CreateAuctionRequest = req.body;

    // Validate auction parameters
    auctionService.validateAuctionParams({
      minPrice,
      maxPrice,
      durationMs,
      name,
      description
    });

    const result = await auctionService.createAuction({
      seller,
      nft,
      minPrice,
      maxPrice,
      durationMs,
      name,
      description,
      signer
    });

    // Notify WebSocket clients
    const io: SocketIOServer = req.app.get('io');
    if (io && result.auction) {
      notifyAuctionCreated(io, result.auction.objectId, seller, {
        name,
        description,
        minPrice,
        maxPrice
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Auction created successfully',
      data: result
    };

    res.status(201).json(response);
  })
);

/**
 * @route   GET /api/auctions
 * @desc    Get all auctions
 * @access  Public
 */
router.get('/',
  asyncHandler(async (req, res) => {
    try {
      // Get all auctions by querying events
      const events = await auctionService.getAllAuctions();
      
      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error('Failed to get auctions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get auctions',
        error: error.message
      });
    }
  })
);

/**
 * @route   GET /api/auctions/:id
 * @desc    Get auction details
 * @access  Public
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const auction = await auctionService.getAuctionDetails(id);
    
    res.json({
      success: true,
      data: auction
    });
  })
);

/**
 * @route   POST /api/auctions/:id/bid
 * @desc    Place a bid on an auction
 * @access  Public
 */
router.post('/:id/bid',
  validateBidParams,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      bidder,
      bidAmount,
      bidderCoin,
      signer
    } = req.body;

    const result = await auctionService.placeBid({
      auctionId: id,
      bidder,
      bidAmount,
      bidderCoin,
      signer
    });

    // Notify WebSocket clients
    const io = req.app.get('io');
    if (io) {
      notifyNewBid(io, id, bidAmount, bidder);
    }

    res.json({
      success: true,
      message: 'Bid placed successfully',
      data: result
    });
  })
);

/**
 * @route   POST /api/auctions/:id/end
 * @desc    End an auction
 * @access  Public
 */
router.post('/:id/end',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      sellerCoin,
      signer
    } = req.body;

    const result = await auctionService.endAuction({
      auctionId: id,
      sellerCoin,
      signer
    });

    // Notify WebSocket clients
    const io = req.app.get('io');
    if (io) {
      // Get auction details to determine winner
      const auction = await auctionService.getAuctionDetails(id);
      const winner = auction.content?.fields?.current_bidder_id || null;
      const finalPrice = auction.content?.fields?.current_bid_amount || 0;
      
      notifyAuctionEnded(io, id, winner, finalPrice);
    }

    res.json({
      success: true,
      message: 'Auction ended successfully',
      data: result
    });
  })
);

/**
 * @route   GET /api/auctions/:id/events
 * @desc    Get auction events
 * @access  Public
 */
router.get('/:id/events',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const events = await auctionService.getAuctionEvents(id, parseInt(limit));
    
    res.json({
      success: true,
      data: events
    });
  })
);

/**
 * @route   GET /api/auctions/:id/history
 * @desc    Get auction bidding history
 * @access  Public
 */
router.get('/:id/history',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const history = await auctionService.getAuctionHistory(id);
    
    res.json({
      success: true,
      data: history
    });
  })
);

/**
 * @route   GET /api/auctions/:id/ceiling
 * @desc    Get current ceiling price
 * @access  Public
 */
router.get('/:id/ceiling',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { clockId } = req.query;
    
    if (!clockId) {
      return res.status(400).json({
        success: false,
        message: 'Clock ID is required'
      });
    }
    
    const ceiling = await auctionService.getCurrentCeiling(id, clockId);
    
    res.json({
      success: true,
      data: { ceiling }
    });
  })
);

/**
 * @route   GET /api/auctions/:id/nft
 * @desc    Get NFT from auction
 * @access  Public
 */
router.get('/:id/nft',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const nft = await auctionService.getAuctionNFT(id);
    
    res.json({
      success: true,
      data: nft
    });
  })
);

/**
 * @route   GET /api/auctions/seller/:address
 * @desc    Get auctions created by a seller
 * @access  Public
 */
router.get('/seller/:address',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    
    const auctions = await auctionService.getSellerAuctions(address);
    
    res.json({
      success: true,
      data: auctions
    });
  })
);

/**
 * @route   POST /api/auctions/:id/check-end
 * @desc    Check if auction should end
 * @access  Public
 */
router.post('/:id/check-end',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { clockId } = req.body;
    
    if (!clockId) {
      return res.status(400).json({
        success: false,
        message: 'Clock ID is required'
      });
    }
    
    const shouldEnd = await auctionService.checkAuctionEnd(id, clockId);
    
    res.json({
      success: true,
      data: { shouldEnd }
    });
  })
);

export default router;
