#!/bin/bash

# Build and tag Docker images for Kubernetes
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📦 Building Docker images for Kubernetes...${NC}"

# Build using docker-compose
docker-compose build

# Get the project name from docker-compose
PROJECT_NAME=$(docker-compose config | grep -A 1 "services:" | head -1 | awk '{print $1}' || echo "food-fast-delivery")

# Tag images for Kubernetes
echo -e "${YELLOW}🏷️  Tagging images...${NC}"

# Function to tag image
tag_image() {
  local service=$1
  local source_tag="${PROJECT_NAME}-${service}:latest"
  local target_tag="ffdd-${service}:latest"
  
  if docker image inspect "$source_tag" &> /dev/null; then
    docker tag "$source_tag" "$target_tag"
    echo -e "${GREEN}✓${NC} Tagged $source_tag → $target_tag"
  else
    # Try alternative naming
    local alt_tag=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "${service}" | head -1)
    if [ ! -z "$alt_tag" ]; then
      docker tag "$alt_tag" "$target_tag"
      echo -e "${GREEN}✓${NC} Tagged $alt_tag → $target_tag"
    else
      echo -e "${YELLOW}⚠${NC}  Image for $service not found"
    fi
  fi
}

tag_image "api-gateway"
tag_image "user-service"
tag_image "restaurant-service"
tag_image "order-service"
tag_image "drone-service"
tag_image "payment-service"
tag_image "client"

echo ""
echo -e "${GREEN}✅ All images are ready for Kubernetes!${NC}"
echo -e "${YELLOW}Note: Docker Desktop automatically makes local images available to Kubernetes${NC}"

