"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const auction_js_1 = __importDefault(require("./routes/auction.js"));
const seller_js_1 = __importDefault(require("./routes/seller.js"));
const bidder_js_1 = __importDefault(require("./routes/bidder.js"));
const nft_js_1 = __importDefault(require("./routes/nft.js"));
const health_js_1 = __importDefault(require("./routes/health.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const requestLogger_js_1 = require("./middleware/requestLogger.js");
const suiClient_js_1 = require("./services/suiClient.js");
const websocket_js_1 = require("./services/websocket.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(requestLogger_js_1.requestLogger);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/health', health_js_1.default);
app.use('/api/auctions', auction_js_1.default);
app.use('/api/sellers', seller_js_1.default);
app.use('/api/bidders', bidder_js_1.default);
app.use('/api/nfts', nft_js_1.default);
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('join_auction', (auctionId) => {
        socket.join(`auction_${auctionId}`);
        console.log(`Client ${socket.id} joined auction ${auctionId}`);
    });
    socket.on('leave_auction', (auctionId) => {
        socket.leave(`auction_${auctionId}`);
        console.log(`Client ${socket.id} left auction ${auctionId}`);
    });
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
app.set('io', io);
app.use(errorHandler_js_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});
async function initializeServices() {
    try {
        await (0, suiClient_js_1.initializeSuiClient)();
        console.log('✅ Sui client initialized');
        (0, websocket_js_1.initializeWebSocket)(io);
        console.log('✅ WebSocket handlers initialized');
        console.log('🚀 All services initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize services:', error);
        process.exit(1);
    }
}
async function startServer() {
    try {
        await initializeServices();
        server.listen(PORT, () => {
            console.log(`🚀 BidSui Backend Server running on port ${PORT}`);
            console.log(`📡 WebSocket server running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
startServer();
//# sourceMappingURL=server.js.map