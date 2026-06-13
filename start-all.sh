#!/bin/bash

echo "Starting Locals services..."

echo ""
echo "Starting Backend Server (port 3000)..."
cd backend
if command -v bun >/dev/null 2>&1; then
  bun run dev &
else
  echo "Bun not found — using npx tsx"
  npx tsx watch src/index.ts &
fi
BACKEND_PID=$!

sleep 3

echo ""
echo "Starting Admin Dashboard (port 3001)..."
cd ../admin
npm run dev &
ADMIN_PID=$!

sleep 3

echo ""
echo "Starting Frontend (Expo)..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "All services are starting..."
echo "- Backend:  http://localhost:3000"
echo "- Admin:    http://localhost:3001"
echo "- Frontend: Check Expo QR code in terminal"
echo ""
echo "Press Ctrl+C to stop all services..."
trap "kill $BACKEND_PID $ADMIN_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
