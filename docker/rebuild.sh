#!/bin/bash

# Script to rebuild Docker images

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Rebuilding Docker images...${NC}"

# Rebuild images
DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker images rebuilt successfully!${NC}"
else
    echo -e "${RED}Failed to rebuild Docker images!${NC}"
    exit 1
fi
