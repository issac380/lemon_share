#!/bin/bash

# Lemon Share - Start Script
# This script starts both the backend and frontend services

set -e

echo "🚀 Starting Lemon Share..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Create media directory if it doesn't exist
mkdir -p backend/media/albums backend/media/thumbs

# Start backend
echo "📡 Starting backend server on port 8001..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server on port 3000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Both services are starting up!"
echo "📡 Backend: http://localhost:8001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
