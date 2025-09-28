import express from 'express';
import { getSuiClient } from '../services/suiClient.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/',
  asyncHandler(async (req, res) => {
    try {
      const client = getSuiClient();
      const version = await client.getRpcApiVersion();
      
      res.json({
        success: true,
        message: 'BidSui Backend is healthy',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          sui: {
            network: process.env.SUI_NETWORK || 'devnet',
            apiVersion: version,
            connected: true
          },
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Service unhealthy',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  })
);

/**
 * @route   GET /api/health/sui
 * @desc    Sui network health check
 * @access  Public
 */
router.get('/sui',
  asyncHandler(async (req, res) => {
    try {
      const client = getSuiClient();
      const version = await client.getRpcApiVersion();
      const network = process.env.SUI_NETWORK || 'devnet';
      
      res.json({
        success: true,
        message: 'Sui network is accessible',
        data: {
          network,
          apiVersion: version,
          rpcUrl: process.env.SUI_RPC_URL,
          connected: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Sui network is not accessible',
        data: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  })
);

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with all services
 * @access  Public
 */
router.get('/detailed',
  asyncHandler(async (req, res) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Check Sui connection
    try {
      const client = getSuiClient();
      const version = await client.getRpcApiVersion();
      healthData.services.sui = {
        status: 'healthy',
        network: process.env.SUI_NETWORK || 'devnet',
        apiVersion: version,
        rpcUrl: process.env.SUI_RPC_URL
      };
    } catch (error) {
      healthData.services.sui = {
        status: 'unhealthy',
        error: error.message
      };
      healthData.status = 'degraded';
    }

    // Check package IDs
    const packageIds = {
      auction: process.env.AUCTION_PACKAGE_ID,
      seller: process.env.SELLER_PACKAGE_ID,
      bidder: process.env.BIDDER_PACKAGE_ID,
    };

    healthData.services.contracts = {
      status: 'healthy',
      packageIds,
      configured: Object.values(packageIds).every(id => id && id !== '0xTODO')
    };

    if (!healthData.services.contracts.configured) {
      healthData.services.contracts.status = 'warning';
      healthData.services.contracts.message = 'Some package IDs are not configured';
      healthData.status = 'degraded';
    }

    // Check file system (for uploads)
    try {
      const fs = await import('fs');
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      fs.accessSync(uploadPath, fs.constants.W_OK);
      healthData.services.filesystem = {
        status: 'healthy',
        uploadPath
      };
    } catch (error) {
      healthData.services.filesystem = {
        status: 'unhealthy',
        error: error.message
      };
      healthData.status = 'degraded';
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: healthData.status === 'healthy',
      message: healthData.status === 'healthy' ? 
               'All services are healthy' : 
               'Some services have issues',
      data: healthData
    });
  })
);

/**
 * @route   GET /api/health/metrics
 * @desc    System metrics endpoint
 * @access  Public
 */
router.get('/metrics',
  asyncHandler(async (req, res) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001,
        suiNetwork: process.env.SUI_NETWORK || 'devnet'
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  })
);

export default router;
