"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auctionService_js_1 = require("../services/auctionService.js");
const validation_js_1 = require("../middleware/validation.js");
const asyncHandler_js_1 = require("../middleware/asyncHandler.js");
const websocket_js_1 = require("../services/websocket.js");
const router = express_1.default.Router();
const auctionService = new auctionService_js_1.AuctionService();
router.post('/', validation_js_1.validateAuctionParams, (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { seller, nft, minPrice, maxPrice, durationMs, name, description, signer } = req.body;
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
    const io = req.app.get('io');
    if (io && result.auction) {
        (0, websocket_js_1.notifyAuctionCreated)(io, result.auction.objectId, seller, {
            name,
            description,
            minPrice,
            maxPrice
        });
    }
    const response = {
        success: true,
        message: 'Auction created successfully',
        data: result
    };
    res.status(201).json(response);
}));
router.get('/', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    try {
        const events = await auctionService.getAllAuctions();
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        console.error('Failed to get auctions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get auctions',
            error: error.message
        });
    }
}));
router.get('/:id', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const auction = await auctionService.getAuctionDetails(id);
    res.json({
        success: true,
        data: auction
    });
}));
router.post('/:id/bid', validation_js_1.validateBidParams, (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { bidder, bidAmount, bidderCoin, signer } = req.body;
    const result = await auctionService.placeBid({
        auctionId: id,
        bidder,
        bidAmount,
        bidderCoin,
        signer
    });
    const io = req.app.get('io');
    if (io) {
        (0, websocket_js_1.notifyNewBid)(io, id, bidAmount, bidder);
    }
    res.json({
        success: true,
        message: 'Bid placed successfully',
        data: result
    });
}));
router.post('/:id/end', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { sellerCoin, signer } = req.body;
    const result = await auctionService.endAuction({
        auctionId: id,
        sellerCoin,
        signer
    });
    const io = req.app.get('io');
    if (io) {
        const auction = await auctionService.getAuctionDetails(id);
        const winner = auction.content?.fields?.current_bidder_id || null;
        const finalPrice = auction.content?.fields?.current_bid_amount || 0;
        (0, websocket_js_1.notifyAuctionEnded)(io, id, winner, finalPrice);
    }
    res.json({
        success: true,
        message: 'Auction ended successfully',
        data: result
    });
}));
router.get('/:id/events', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const events = await auctionService.getAuctionEvents(id, parseInt(limit));
    res.json({
        success: true,
        data: events
    });
}));
router.get('/:id/history', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const history = await auctionService.getAuctionHistory(id);
    res.json({
        success: true,
        data: history
    });
}));
router.get('/:id/ceiling', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
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
}));
router.get('/:id/nft', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const nft = await auctionService.getAuctionNFT(id);
    res.json({
        success: true,
        data: nft
    });
}));
router.get('/seller/:address', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
    const { address } = req.params;
    const auctions = await auctionService.getSellerAuctions(address);
    res.json({
        success: true,
        data: auctions
    });
}));
router.post('/:id/check-end', (0, asyncHandler_js_1.asyncHandler)(async (req, res) => {
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
}));
exports.default = router;
//# sourceMappingURL=auction.js.map