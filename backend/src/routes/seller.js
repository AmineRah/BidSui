import express from 'express';
import { getSuiClient, createTransactionBlock, executeTransactionBlock } from '../services/suiClient.js';
import { validateCreateSellerParams } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * @route   POST /api/sellers
 * @desc    Create a seller profile
 * @access  Public
 */
router.post('/',
  validateCreateSellerParams,
  asyncHandler(async (req, res) => {
    const {
      name,
      coin,
      signer
    } = req.body;

    try {
      const tx = createTransactionBlock();
      
      // Create seller profile
      const [sellerProfile] = tx.moveCall({
        target: `${process.env.SELLER_PACKAGE_ID}::Seller::create_seller_profile`,
        arguments: [
          tx.pure.string(name),
          tx.object(coin),
        ],
      });

      const result = await executeTransactionBlock(tx, signer);
      
      res.status(201).json({
        success: true,
        message: 'Seller profile created successfully',
        data: {
          transactionDigest: result.digest,
          sellerProfile: result.objectChanges?.find(
            change => change.type === 'created' && change.objectType?.includes('SellerProfile')
          ),
          events: result.events,
        }
      });
    } catch (error) {
      throw new Error(`Failed to create seller profile: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/sellers/:address/profile
 * @desc    Get seller profile
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

      const sellerProfile = objects.find(obj => 
        obj.type?.includes('SellerProfile')
      );

      if (!sellerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Seller profile not found'
        });
      }

      res.json({
        success: true,
        data: sellerProfile
      });
    } catch (error) {
      throw new Error(`Failed to get seller profile: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/sellers/:address/auctions
 * @desc    Get auctions created by seller
 * @access  Public
 */
router.get('/:address/auctions',
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

      const auctions = objects.filter(obj => 
        obj.type?.includes('Auction')
      );

      res.json({
        success: true,
        data: auctions
      });
    } catch (error) {
      throw new Error(`Failed to get seller auctions: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/sellers/:address/stats
 * @desc    Get seller statistics
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

      const sellerProfile = objects.find(obj => 
        obj.type?.includes('SellerProfile')
      );

      const auctions = objects.filter(obj => 
        obj.type?.includes('Auction')
      );

      const stats = {
        totalAuctions: auctions.length,
        activeAuctions: auctions.filter(auction => 
          !auction.content?.fields?.ended
        ).length,
        totalSales: sellerProfile?.content?.fields?.total_sales || 0,
        reputation: sellerProfile?.content?.fields?.reputation || 0,
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      throw new Error(`Failed to get seller stats: ${error.message}`);
    }
  })
);

/**
 * @route   POST /api/sellers/:address/balance
 * @desc    Get seller balance
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
      throw new Error(`Failed to get seller balance: ${error.message}`);
    }
  })
);

export default router;
