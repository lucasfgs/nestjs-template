#!/bin/bash

# Script to stop Docker Compose services

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Stopping Docker Compose...${NC}"

# Stop and remove containers
docker compose down

# Check if stopped successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker containers stopped successfully!${NC}"
    
    # Ask if user wants to remove volumes
    read -p "Do you want to remove volumes (database data will be lost)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down -v
        echo -e "${GREEN}Volumes removed successfully!${NC}"
    fi
else
    echo -e "${RED}Failed to stop Docker containers!${NC}"
    exit 1
fi
