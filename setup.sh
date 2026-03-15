#!/bin/bash

echo "Setting up Zomato Clothing Admin Dashboard..."

echo ""
echo "1. Installing backend dependencies..."
cd backend
npm install
echo ""

echo "3. Installing admin dashboard dependencies..."
cd ../admin
npm install
echo ""

echo "4. Installing frontend dependencies..."
cd ../frontend
npm install
echo ""

echo "Setup complete!"
echo ""
echo "To start the services:"
echo "- Backend: cd backend && npm run dev"
echo "- Admin Dashboard: cd admin && npm run dev"
echo "- Frontend: cd frontend && npm start"
echo ""
