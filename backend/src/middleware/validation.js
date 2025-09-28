import Joi from 'joi';

/**
 * Validation schemas
 */
const schemas = {
  createAuction: Joi.object({
    seller: Joi.string().required(),
    nft: Joi.string().required(),
    minPrice: Joi.number().positive().required(),
    maxPrice: Joi.number().positive().required(),
    durationMs: Joi.number().positive().required(),
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(500).required(),
    signer: Joi.string().required()
  }),

  placeBid: Joi.object({
    bidder: Joi.string().required(),
    bidAmount: Joi.number().positive().required(),
    bidderCoin: Joi.string().required(),
    signer: Joi.string().required()
  }),

  createSeller: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    coin: Joi.string().required(),
    signer: Joi.string().required()
  }),

  createBidder: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    signer: Joi.string().required()
  }),

  endAuction: Joi.object({
    sellerCoin: Joi.string().required(),
    signer: Joi.string().required()
  }),

  createNFT: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(500).required(),
    imageUrl: Joi.string().uri().required(),
    signer: Joi.string().required()
  }),

  transferNFT: Joi.object({
    recipient: Joi.string().required(),
    signer: Joi.string().required()
  })
};

/**
 * Generic validation middleware
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
}

/**
 * Specific validation middlewares
 */
export const validateAuctionParams = validateRequest(schemas.createAuction);
export const validateBidParams = validateRequest(schemas.placeBid);
export const validateCreateSellerParams = validateRequest(schemas.createSeller);
export const validateCreateBidderParams = validateRequest(schemas.createBidder);
export const validateEndAuctionParams = validateRequest(schemas.endAuction);
export const validateCreateNFTParams = validateRequest(schemas.createNFT);
export const validateTransferNFTParams = validateRequest(schemas.transferNFT);

/**
 * Validate Sui address
 */
export function validateSuiAddress(req, res, next) {
  const { address } = req.params;
  
  // Basic Sui address validation (0x followed by 64 hex characters)
  const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
  
  if (!suiAddressRegex.test(address)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Sui address format'
    });
  }
  
  next();
}

/**
 * Validate object ID
 */
export function validateObjectId(req, res, next) {
  const { id } = req.params;
  
  // Basic Sui object ID validation (0x followed by 64 hex characters)
  const objectIdRegex = /^0x[a-fA-F0-9]{64}$/;
  
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid object ID format'
    });
  }
  
  next();
}

/**
 * Validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const { page = 1, limit = 20 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid page parameter'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid limit parameter (must be between 1 and 100)'
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
}
