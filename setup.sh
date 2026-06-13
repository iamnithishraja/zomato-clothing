#!/bin/bash

echo "Setting up Locals project..."

echo ""
echo "1. Installing backend dependencies..."
cd backend
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi
echo ""

echo "2. Installing admin dashboard dependencies..."
cd ../admin
npm install
echo ""

echo "3. Installing frontend dependencies..."
cd ../frontend
npm install
echo ""

echo "Setup complete!"
echo ""
echo "To start all services: ./start-all.sh"
echo "Or individually:"
echo "- Backend:  cd backend && bun run dev   (or: npm run dev:node)"
echo "- Admin:    cd admin && npm run dev"
echo "- Frontend: cd frontend && npm start"
echo ""
echo "Ports: Backend 3000 | Admin 3001 | Expo dev server"
echo "Set EXPO_PUBLIC_BACKEND_URL in frontend/.env to your LAN IP, e.g. http://192.168.1.100:3000"
echo ""
