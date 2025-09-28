const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Store auctions in memory
let auctions = [
  {
    id: 'auction_1',
    name: 'Test Auction 1',
    description: 'This is a test auction',
    minVal: 100,
    maxVal: 1000,
    currentBidAmount: 150,
    sellerId: '0x1234567890abcdef',
    startTime: Date.now() - 3600000, // 1 hour ago
    deadLine: Date.now() + 86400000, // 24 hours from now
    ended: false,
    escrowedNft: 'nft_123'
  },
  {
    id: 'auction_2',
    name: 'Test Auction 2',
    description: 'Another test auction',
    minVal: 200,
    maxVal: 2000,
    currentBidAmount: 300,
    sellerId: '0xabcdef1234567890',
    startTime: Date.now() - 7200000, // 2 hours ago
    deadLine: Date.now() + 172800000, // 48 hours from now
    ended: false,
    escrowedNft: 'nft_456'
  }
];

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// NFT mint endpoint
app.post('/api/nfts/mint', upload.single('image'), async (req, res) => {
  console.log('NFT mint request received:', req.body);
  console.log('Image file:', req.file ? 'File received' : 'No file received');
  
  try {
    // For now, we'll use a mock approach but with real structure
    // In production, this would upload to IPFS and create real NFT
    const mockNFTId = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imageUrl = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : 'https://via.placeholder.com/300x300';
    
    // Create NFT metadata
    const nftMetadata = {
      name: req.body.name,
      description: req.body.description,
      image: imageUrl,
      attributes: [
        { trait_type: "Created", value: new Date().toISOString() },
        { trait_type: "Platform", value: "BidSui" }
      ]
    };
    
    res.json({
      success: true,
      message: 'NFT minted successfully',
      data: {
        objectId: mockNFTId,
        transactionDigest: `tx_${Date.now()}`,
        file: { 
          filename: req.file ? req.file.originalname : 'mock-image.png',
          size: req.file ? req.file.size : 0
        },
        nft: { 
          objectId: mockNFTId,
          metadata: nftMetadata
        },
        events: []
      }
    });
  } catch (error) {
    console.error('NFT creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NFT',
      message: error.message
    });
  }
});

// Auction creation endpoint
app.post('/api/auctions', (req, res) => {
  console.log('Auction creation request received:', req.body);
  
  // Create new auction with enhanced data structure
  const newAuction = {
    id: `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: req.body.name,
    description: req.body.description,
    minVal: req.body.minPrice,
    maxVal: req.body.maxPrice,
    currentBidAmount: req.body.minPrice, // Start with minimum price
    sellerId: req.body.seller,
    startTime: Date.now(),
    deadLine: Date.now() + req.body.durationMs,
    ended: false,
    escrowedNft: req.body.nft,
    // Add NFT metadata for display
    nftMetadata: {
      name: req.body.name,
      description: req.body.description,
      image: `https://via.placeholder.com/300x300?text=${encodeURIComponent(req.body.name)}`,
      attributes: [
        { trait_type: "Created", value: new Date().toISOString() },
        { trait_type: "Platform", value: "BidSui" },
        { trait_type: "Auction Type", value: "Dutch Auction" }
      ]
    },
    // Add display properties
    mainImage: `https://via.placeholder.com/300x300?text=${encodeURIComponent(req.body.name)}`,
    category: "NFT",
    tags: ["Sui", "NFT", "Blockchain"],
    status: "active"
  };
  
  // Add to auctions array
  auctions.push(newAuction);
  
  console.log('New auction added:', newAuction);
  console.log('Total auctions:', auctions.length);
  
  res.json({
    success: true,
    message: 'Auction created successfully',
    data: {
      auction: newAuction
    }
  });
});

// Get all auctions endpoint
app.get('/api/auctions', (req, res) => {
  console.log('Get auctions request received');
  console.log('Returning', auctions.length, 'auctions');
  
  res.json({
    success: true,
    data: auctions
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎨 NFT mint: POST http://localhost:${PORT}/api/nfts/mint`);
  console.log(`🏆 Auction create: POST http://localhost:${PORT}/api/auctions`);
});
