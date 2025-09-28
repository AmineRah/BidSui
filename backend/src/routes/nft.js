import express from 'express';
import { getSuiClient, getObject, getObjects } from '../services/suiClient.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/nfts/upload
 * @desc    Upload NFT metadata and image
 * @access  Public
 */
router.post('/upload',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const {
        name,
        description,
        attributes
      } = req.body;

      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'Name and description are required'
        });
      }

      // Create NFT metadata
      const metadata = {
        name,
        description,
        image: `/uploads/${req.file.filename}`,
        attributes: attributes ? JSON.parse(attributes) : [],
        createdAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'NFT metadata uploaded successfully',
        data: {
          metadata,
          file: req.file
        }
      });
    } catch (error) {
      throw new Error(`Failed to upload NFT: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/nfts/:id
 * @desc    Get NFT details
 * @access  Public
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    try {
      const nft = await getObject(id);
      
      if (!nft.data) {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }

      res.json({
        success: true,
        data: nft.data
      });
    } catch (error) {
      throw new Error(`Failed to get NFT: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/nfts/owner/:address
 * @desc    Get NFTs owned by an address
 * @access  Public
 */
router.get('/owner/:address',
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

      // Filter for NFT-like objects (customize based on your NFT types)
      const nfts = objects.filter(obj => 
        obj.type?.includes('ExampleNFT') || 
        obj.type?.includes('NFT') ||
        obj.content?.dataType === 'moveObject'
      );

      res.json({
        success: true,
        data: nfts
      });
    } catch (error) {
      throw new Error(`Failed to get owned NFTs: ${error.message}`);
    }
  })
);

/**
 * @route   POST /api/nfts/mint
 * @desc    Mint a new NFT (upload image + create on blockchain)
 * @access  Public
 */
router.post('/mint',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const {
        name,
        description,
        signer
      } = req.body;

      if (!name || !description || !signer) {
        return res.status(400).json({
          success: false,
          message: 'Name, description, and signer are required'
        });
      }

      // Create NFT on blockchain
      const { createTransactionBlock, executeTransactionBlock } = await import('../services/suiClient.js');
      
      const tx = createTransactionBlock();
      
      // Create NFT using your smart contract
      const [nft] = tx.moveCall({
        target: `${process.env.AUCTION_PACKAGE_ID}::ExampleNFT::create_nft`,
        arguments: [
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.string(`/uploads/${req.file.filename}`), // Image URL
        ],
      });

      // Transfer to the signer
      tx.transferObjects([nft], signer);

      const result = await executeTransactionBlock(tx, signer);
      
      // Find the created NFT object
      const nftObject = result.objectChanges?.find(
        change => change.type === 'created' && change.objectType?.includes('ExampleNFT')
      );

      if (!nftObject) {
        throw new Error('NFT creation failed - no object created');
      }

      res.status(201).json({
        success: true,
        message: 'NFT minted successfully',
        data: {
          objectId: nftObject.objectId,
          transactionDigest: result.digest,
          file: req.file,
          nft: nftObject,
          events: result.events,
        }
      });
    } catch (error) {
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  })
);

/**
 * @route   POST /api/nfts/create
 * @desc    Create a new NFT (if you have a mint function)
 * @access  Public
 */
router.post('/create',
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      imageUrl,
      signer
    } = req.body;

    if (!name || !description || !signer) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and signer are required'
      });
    }

    try {
      const { createTransactionBlock, executeTransactionBlock } = await import('../services/suiClient.js');
      
      const tx = createTransactionBlock();
      
      // Create NFT (assuming you have an ExampleNFT module)
      const [nft] = tx.moveCall({
        target: `${process.env.AUCTION_PACKAGE_ID}::ExampleNFT::create_nft`,
        arguments: [
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.string(imageUrl),
        ],
      });

      const result = await executeTransactionBlock(tx, signer);
      
      res.status(201).json({
        success: true,
        message: 'NFT created successfully',
        data: {
          transactionDigest: result.digest,
          nft: result.objectChanges?.find(
            change => change.type === 'created' && change.objectType?.includes('ExampleNFT')
          ),
          events: result.events,
        }
      });
    } catch (error) {
      throw new Error(`Failed to create NFT: ${error.message}`);
    }
  })
);

/**
 * @route   POST /api/nfts/:id/transfer
 * @desc    Transfer NFT to another address
 * @access  Public
 */
router.post('/:id/transfer',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      recipient,
      signer
    } = req.body;

    if (!recipient || !signer) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and signer are required'
      });
    }

    try {
      const { createTransactionBlock, executeTransactionBlock } = await import('../services/suiClient.js');
      
      const tx = createTransactionBlock();
      
      // Transfer NFT
      tx.transferObjects([tx.object(id)], recipient);

      const result = await executeTransactionBlock(tx, signer);
      
      res.json({
        success: true,
        message: 'NFT transferred successfully',
        data: {
          transactionDigest: result.digest,
          events: result.events,
        }
      });
    } catch (error) {
      throw new Error(`Failed to transfer NFT: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/nfts/:id/metadata
 * @desc    Get NFT metadata
 * @access  Public
 */
router.get('/:id/metadata',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    try {
      const nft = await getObject(id);
      
      if (!nft.data) {
        return res.status(404).json({
          success: false,
          message: 'NFT not found'
        });
      }

      // Extract metadata from NFT content
      const metadata = {
        name: nft.data.content?.fields?.name,
        description: nft.data.content?.fields?.description,
        imageUrl: nft.data.content?.fields?.image_url,
        owner: nft.data.owner,
        type: nft.data.type,
        createdAt: nft.data.previousTransaction,
      };

      res.json({
        success: true,
        data: metadata
      });
    } catch (error) {
      throw new Error(`Failed to get NFT metadata: ${error.message}`);
    }
  })
);

/**
 * @route   GET /api/nfts/search
 * @desc    Search NFTs
 * @access  Public
 */
router.get('/search',
  asyncHandler(async (req, res) => {
    const { query, type, owner } = req.query;
    const client = getSuiClient();
    
    try {
      // This is a simplified search - you might want to implement more sophisticated search
      let objects = [];
      
      if (owner) {
        objects = await client.getObjectsOwnedByAddress({
          address: owner,
          options: {
            showContent: true,
            showType: true,
            showOwner: true,
          },
        });
      }

      // Filter by type if specified
      if (type) {
        objects = objects.filter(obj => obj.type?.includes(type));
      }

      // Filter by query if specified (search in name/description)
      if (query) {
        objects = objects.filter(obj => {
          const name = obj.content?.fields?.name?.toLowerCase() || '';
          const description = obj.content?.fields?.description?.toLowerCase() || '';
          const searchQuery = query.toLowerCase();
          return name.includes(searchQuery) || description.includes(searchQuery);
        });
      }

      res.json({
        success: true,
        data: objects
      });
    } catch (error) {
      throw new Error(`Failed to search NFTs: ${error.message}`);
    }
  })
);

export default router;
