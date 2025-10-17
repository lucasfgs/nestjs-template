#!/bin/bash

# Script to access the NestJS container shell

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

CONTAINER_NAME="nestjs-app"

echo -e "${BLUE}Accessing ${CONTAINER_NAME} shell...${NC}"

# Check if container is running
if [ ! "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running!${NC}"
    exit 1
fi

# Access container shell
docker exec -it $CONTAINER_NAME sh
