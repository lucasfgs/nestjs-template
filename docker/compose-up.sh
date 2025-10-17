#!/bin/bash

# Script to start Docker Compose services

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${BLUE}Creating .env from .env-example template...${NC}"
    if [ -f .env-example ]; then
        cp .env-example .env
        echo -e "${GREEN}.env file created successfully!${NC}"
        echo -e "${RED}Please update the .env file with your actual values before continuing.${NC}"
        exit 1
    else
        echo -e "${RED}.env-example template not found!${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}Starting Docker containers...${NC}"

# Start containers (build automatically if needed)
DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose up -d --build

# Check if containers started successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker containers started successfully!${NC}"
    echo -e "${BLUE}Running services:${NC}"
    docker compose ps
    
    echo -e "${GREEN}Environment is ready!${NC}"
    echo -e "${BLUE}API: http://localhost:4000${NC}"
    echo -e "${BLUE}Database: localhost:3306${NC}"
    echo -e "${BLUE}API Docs: http://localhost:4000/docs${NC}"
    
    echo -e "${BLUE}To view logs: docker compose logs -f${NC}"
else
    echo -e "${RED}Failed to start Docker containers!${NC}"
    exit 1
fi
