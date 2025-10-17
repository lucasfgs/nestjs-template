#!/bin/bash

# Script to run Prisma commands inside the Docker container

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

CONTAINER_NAME="nestjs-app"

# Check if container is running
if [ ! "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running!${NC}"
    exit 1
fi

echo -e "${BLUE}Running Prisma command in ${CONTAINER_NAME}...${NC}"

# Run Prisma command
docker exec -it $CONTAINER_NAME npx prisma $@

echo -e "${GREEN}Prisma command completed!${NC}"
