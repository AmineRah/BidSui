import { AuctionService } from './auctionService.js';
import cron from 'node-cron';

let auctionService = null;

/**
 * Initialize WebSocket handlers
 */
export function initializeWebSocket(io) {
  auctionService = new AuctionService();
  
  // Set up real-time auction updates
  setupAuctionUpdates(io);
  
  // Set up periodic auction checks
  setupPeriodicChecks(io);
  
  console.log('WebSocket handlers initialized');
}

/**
 * Set up real-time auction updates
 */
function setupAuctionUpdates(io) {
  io.on('connection', (socket) => {
    // Handle joining auction room
    socket.on('join_auction', async (auctionId) => {
      try {
        socket.join(`auction_${auctionId}`);
        
        // Send current auction state
        const auctionDetails = await auctionService.getAuctionDetails(auctionId);
        socket.emit('auction_update', {
          type: 'joined',
          auctionId,
          data: auctionDetails,
          timestamp: Date.now()
        });
        
        console.log(`Client ${socket.id} joined auction ${auctionId}`);
      } catch (error) {
        socket.emit('error', {
          type: 'join_auction_failed',
          message: error.message,
          auctionId
        });
      }
    });

    // Handle leaving auction room
    socket.on('leave_auction', (auctionId) => {
      socket.leave(`auction_${auctionId}`);
      console.log(`Client ${socket.id} left auction ${auctionId}`);
    });

    // Handle bid updates
    socket.on('bid_placed', async (data) => {
      try {
        const { auctionId, bidAmount, bidder } = data;
        
        // Broadcast bid to all clients in the auction room
        io.to(`auction_${auctionId}`).emit('bid_update', {
          type: 'new_bid',
          auctionId,
          bidAmount,
          bidder,
          timestamp: Date.now()
        });
        
        // Check if auction should end due to ceiling reached
        await checkAndNotifyAuctionEnd(io, auctionId);
        
      } catch (error) {
        socket.emit('error', {
          type: 'bid_update_failed',
          message: error.message
        });
      }
    });

    // Handle auction creation
    socket.on('auction_created', async (data) => {
      try {
        const { auctionId, seller } = data;
        
        // Broadcast new auction to all connected clients
        io.emit('new_auction', {
          type: 'auction_created',
          auctionId,
          seller,
          timestamp: Date.now()
        });
        
      } catch (error) {
        socket.emit('error', {
          type: 'auction_creation_notification_failed',
          message: error.message
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client ${socket.id} disconnected`);
    });
  });
}

/**
 * Set up periodic checks for auction status
 */
function setupPeriodicChecks(io) {
  // Check for expired auctions every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkExpiredAuctions(io);
    } catch (error) {
      console.error('Error in periodic auction check:', error);
    }
  });
}

/**
 * Check for expired auctions and notify clients
 */
async function checkExpiredAuctions(io) {
  try {
    // This would typically query all active auctions
    // For now, we'll emit a general check event
    io.emit('periodic_check', {
      type: 'auction_status_check',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to check expired auctions:', error);
  }
}

/**
 * Check if auction should end and notify clients
 */
async function checkAndNotifyAuctionEnd(io, auctionId) {
  try {
    // This would check if the auction should end due to ceiling reached
    // For now, we'll emit a check event
    io.to(`auction_${auctionId}`).emit('auction_check', {
      type: 'end_check',
      auctionId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to check auction end:', error);
  }
}

/**
 * Notify auction ended
 */
export function notifyAuctionEnded(io, auctionId, winner, finalPrice) {
  io.to(`auction_${auctionId}`).emit('auction_ended', {
    type: 'auction_ended',
    auctionId,
    winner,
    finalPrice,
    timestamp: Date.now()
  });
  
  // Also broadcast to all clients
  io.emit('auction_ended', {
    type: 'auction_ended',
    auctionId,
    winner,
    finalPrice,
    timestamp: Date.now()
  });
}

/**
 * Notify new bid
 */
export function notifyNewBid(io, auctionId, bidAmount, bidder) {
  io.to(`auction_${auctionId}`).emit('bid_update', {
    type: 'new_bid',
    auctionId,
    bidAmount,
    bidder,
    timestamp: Date.now()
  });
}

/**
 * Notify auction created
 */
export function notifyAuctionCreated(io, auctionId, seller, details) {
  io.emit('new_auction', {
    type: 'auction_created',
    auctionId,
    seller,
    details,
    timestamp: Date.now()
  });
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(io) {
  return io.engine.clientsCount;
}

/**
 * Get clients in auction room
 */
export function getClientsInAuction(io, auctionId) {
  const room = io.sockets.adapter.rooms.get(`auction_${auctionId}`);
  return room ? room.size : 0;
}
