#!/bin/bash

# BidSui Project Startup Script

echo "🚀 Starting BidSui Project..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18.12.0 or higher."
    exit 1
fi

if ! command_exists pnpm; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

if ! command_exists sui; then
    echo "⚠️  Sui CLI not found. Please install it:"
    echo "Visit: https://docs.sui.io/build/install"
    echo "Continuing without Sui CLI..."
fi

echo "✅ Prerequisites check completed"

# Check if backend is already running
if port_in_use 3001; then
    echo "⚠️  Backend is already running on port 3001"
else
    echo "🔧 Starting Backend..."
    cd backend
    
    # Install backend dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Start backend in background
    npm run dev &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    cd ..
fi

# Wait a moment for backend to start
sleep 3

# Check if frontend is already running
if port_in_use 3000; then
    echo "⚠️  Frontend is already running on port 3000"
else
    echo "🎨 Starting Frontend..."
    cd frontend
    
    # Install frontend dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        pnpm install
    fi
    
    # Start frontend in background
    pnpm dev &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    cd ..
fi

echo ""
echo "🎉 BidSui Project is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "📚 Documentation:"
echo "  - Backend: ./backend/README.md"
echo "  - Smart Contracts: ./move/sources/"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
