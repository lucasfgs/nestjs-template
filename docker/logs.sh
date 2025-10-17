#!/bin/bash

# Script to view logs from Docker Compose services

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Viewing logs...${NC}"
echo -e "${BLUE}Press Ctrl+C to exit${NC}\n"

# Follow logs
docker compose logs -f $@
