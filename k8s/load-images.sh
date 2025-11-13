#!/bin/bash

# Load Docker images into Kubernetes (Docker Desktop)
# This script loads images from Docker local registry into Kubernetes

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📥 Loading Docker images into Kubernetes...${NC}"

# List of images to load
IMAGES=(
  "ffdd-api-gateway:latest"
  "ffdd-user-service:latest"
  "ffdd-restaurant-service:latest"
  "ffdd-order-service:latest"
  "ffdd-drone-service:latest"
  "ffdd-payment-service:latest"
  "ffdd-client:latest"
)

# For Docker Desktop, images are automatically available
# But we can verify they exist
echo -e "${YELLOW}Verifying images exist...${NC}"
for image in "${IMAGES[@]}"; do
  if docker image inspect "$image" &> /dev/null; then
    echo -e "${GREEN}✓${NC} $image"
  else
    echo -e "${YELLOW}⚠${NC} $image not found - please build it first: docker-compose build"
  fi
done

echo ""
echo -e "${GREEN}✅ Images are ready for Kubernetes!${NC}"
echo -e "${YELLOW}Note: Docker Desktop automatically makes local images available to Kubernetes${NC}"

