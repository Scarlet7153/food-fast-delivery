#!/bin/bash

echo "========================================"
echo "Testing all services..."
echo "========================================"

echo ""
echo "[1/6] Testing User Service..."
cd services/user-service
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm test || exit 1
cd ../..

echo ""
echo "[2/6] Testing API Gateway..."
cd services/api-gateway
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm test || exit 1
cd ../..

echo ""
echo "[3/6] Testing Order Service..."
cd services/order-service
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm test || exit 1
cd ../..

echo ""
echo "[4/6] Testing Restaurant Service..."
cd services/restaurant-service
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm test || exit 1
cd ../..

echo ""
echo "[5/6] Testing Drone Service..."
cd services/drone-service
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm test || exit 1
cd ../..

echo ""
echo "[6/6] Testing Payment Service..."
cd services/payment-service
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
npm test || exit 1
cd ../..

echo ""
echo "========================================"
echo "✅ All tests completed successfully!"
echo "========================================"

