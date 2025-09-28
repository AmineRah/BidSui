import express from 'express';
import { getSuiClient, createTransactionBlock, executeTransactionBlock } from '../services/suiClient.js';
import { validateCreateBidderParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * @route   POST /api/bidders
 * @desc    Create a bidder profile
 * @access  Public
 */
router.post('/',
  validateCreateBidderParams,
  asyncHandler(async (req, res) => {
    const {
      name,
      signer
    } = req.body;

    try {
      const tx = createTransactionBlock();
      
      // Create bidder profile
      const [bidderProfile] = tx.moveCall({
        target: `${process.env.BIDDER_PACKAGE_ID}::Bidder::create_bidder_profile`,
        arguments: [
          tx.pure.string(name),
        ],
      });

      const result = await executeTransactionBlock(tx, signer);
      
      res.status(201).json({
        success: true,
        message: 'Bidder profile created successfully',
        data: {
          transactionDigest: result.digest,
          bidderProfile: result.objectChanges?.find(
            change => change.type === 'created' && change.objectType?.includes('BidderProfile')
          ),
          events: result.events,
        }
      });
    } catch (error) {
      throw new Error(`Failed to create bidder profile: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/bidders/:address/profile
 * @desc    Get bidder profile
 * @access  Public
 */
router.get('/:address/profile',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const client = getSuiClient();
    
    try {
      const objects = await client.getObjectsOwnedByAddress({
        address,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      const bidderProfile = objects.find(obj => 
        obj.type?.includes('BidderProfile')
      );

      if (!bidderProfile) {
        return res.status(404).json({
          success: false,
          message: 'Bidder profile not found'
        });
      }

      res.json({
        success: true,
        data: bidderProfile
      });
    } catch (error) {
      throw new Error(`Failed to get bidder profile: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/bidders/:address/bids
 * @desc    Get bidder's bid history
 * @access  Public
 */
router.get('/:address/bids',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const client = getSuiClient();
    
    try {
      const objects = await client.getObjectsOwnedByAddress({
        address,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      const bidderProfile = objects.find(obj => 
        obj.type?.includes('BidderProfile')
      );

      if (!bidderProfile) {
        return res.status(404).json({
          success: false,
          message: 'Bidder profile not found'
        });
      }

      // Extract bid history from the profile
      const bidHistory = bidderProfile.content?.fields?.bid_history || [];
      const participatedAuctions = bidderProfile.content?.fields?.participated_auctions || [];

      res.json({
        success: true,
        data: {
          bidHistory,
          participatedAuctions,
          totalBids: bidHistory.length,
          totalWins: bidderProfile.content?.fields?.total_wins || 0,
          totalSpent: bidderProfile.content?.fields?.total_spent || 0,
        }
      });
    } catch (error) {
      throw new Error(`Failed to get bidder bids: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/bidders/:address/stats
 * @desc    Get bidder statistics
 * @access  Public
 */
router.get('/:address/stats',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const client = getSuiClient();
    
    try {
      const objects = await client.getObjectsOwnedByAddress({
        address,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      const bidderProfile = objects.find(obj => 
        obj.type?.includes('BidderProfile')
      );

      if (!bidderProfile) {
        return res.status(404).json({
          success: false,
          message: 'Bidder profile not found'
        });
      }

      const stats = {
        name: bidderProfile.content?.fields?.name || '',
        totalWins: bidderProfile.content?.fields?.total_wins || 0,
        totalSpent: bidderProfile.content?.fields?.total_spent || 0,
        totalBids: bidderProfile.content?.fields?.bid_history?.length || 0,
        participatedAuctions: bidderProfile.content?.fields?.participated_auctions?.length || 0,
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      throw new Error(`Failed to get bidder stats: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/bidders/:address/balance
 * @desc    Get bidder balance
 * @access  Public
 */
router.get('/:address/balance',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { coinType = '0x2::sui::SUI' } = req.query;
    const client = getSuiClient();
    
    try {
      const balance = await client.getBalance({
        owner: address,
        coinType,
      });

      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      throw new Error(`Failed to get bidder balance: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/bidders/:address/active-bids
 * @desc    Get bidder's active bids
 * @access  Public
 */
router.get('/:address/active-bids',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const client = getSuiClient();
    
    try {
      // Get all auctions where this address is the current bidder
      const objects = await client.getObjectsOwnedByAddress({
        address,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      const auctions = objects.filter(obj => 
        obj.type?.includes('Auction')
      );

      const activeBids = auctions.filter(auction => {
        const currentBidder = auction.content?.fields?.current_bidder_id;
        const ended = auction.content?.fields?.ended;
        return currentBidder === address && !ended;
      });

      res.json({
        success: true,
        data: activeBids
      });
    } catch (error) {
      throw new Error(`Failed to get active bids: ${error.message}`);
    }
  })
);

/**
 * @route   POST /api/bidders/:address/update-profile
 * @desc    Update bidder profile
 * @access  Public
 */
router.post('/:address/update-profile',
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const {
      name,
      signer
    } = req.body;

    try {
      const tx = createTransactionBlock();
      
      // Update bidder profile (assuming there's an update function)
      // This would need to be implemented in the smart contract
      const result = tx.moveCall({
        target: `${process.env.BIDDER_PACKAGE_ID}::Bidder::update_profile`,
        arguments: [
          tx.pure.string(name),
        ],
      });

      const executionResult = await executeTransactionBlock(tx, signer);
      
      res.json({
        success: true,
        message: 'Bidder profile updated successfully',
        data: {
          transactionDigest: executionResult.digest,
          events: executionResult.events,
        }
      });
    } catch (error) {
      throw new Error(`Failed to update bidder profile: ${error.message}`);
    }
  })
);

export default router;
