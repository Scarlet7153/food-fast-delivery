#!/bin/bash

# Fast Food Delivery Drone System - Kubernetes Deployment Script
# For Docker Desktop Kubernetes

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying Fast Food Delivery Drone System to Kubernetes${NC}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

# Check if Kubernetes is running
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Kubernetes cluster is not running. Please enable Kubernetes in Docker Desktop.${NC}"
    exit 1
fi

# Build and tag Docker images
if [ -f "k8s/build-images.sh" ]; then
  bash k8s/build-images.sh
else
  echo -e "${YELLOW}📦 Building Docker images...${NC}"
  docker-compose build
  echo -e "${YELLOW}⚠️  Please tag images manually or run: bash k8s/build-images.sh${NC}"
fi

# Apply namespace
echo -e "${YELLOW}📝 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap and Secrets
echo -e "${YELLOW}📝 Creating ConfigMap and Secrets...${NC}"
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Apply MongoDB
echo -e "${YELLOW}📝 Deploying MongoDB...${NC}"
kubectl apply -f k8s/mongodb.yaml

# Wait for MongoDB to be ready
echo -e "${YELLOW}⏳ Waiting for MongoDB to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=mongodb -n ffdd --timeout=300s

# Apply services
echo -e "${YELLOW}📝 Deploying microservices...${NC}"
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/restaurant-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/drone-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/client.yaml

# Wait for deployments
echo -e "${YELLOW}⏳ Waiting for all deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment --all -n ffdd --timeout=300s

# Show status
echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${GREEN}📊 Service Status:${NC}"
kubectl get pods -n ffdd
kubectl get services -n ffdd

echo ""
echo -e "${GREEN}🌐 Services are available at:${NC}"
echo "  API Gateway: http://localhost:30001"
echo "  Client: http://localhost:30173"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  kubectl get pods -n ffdd              # View pods"
echo "  kubectl get services -n ffdd          # View services"
echo "  kubectl logs -f <pod-name> -n ffdd    # View logs"
echo "  kubectl delete namespace ffdd         # Delete everything"

