#!/bin/bash

echo "Starting Zomato Clothing Services..."

echo ""
echo "Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

sleep 3

echo ""
echo "Starting Admin Dashboard..."
cd ../admin
npm run dev &
ADMIN_PID=$!

sleep 3

echo ""
echo "Starting Frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "All services are starting..."
echo "- Backend: http://localhost:80"
echo "- Admin Dashboard: http://localhost:3001"
echo "- Frontend: Check Expo QR code or console"
echo ""

# Wait for user input to stop
echo "Press Ctrl+C to stop all services..."
trap "kill $BACKEND_PID $ADMIN_PID $FRONTEND_PID; exit" INT
wait
