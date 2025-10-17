#!/bin/bash

# Script to verify Docker setup is working correctly

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Docker Setup Verification Script   ║${NC}"
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo ""

# Configuration
API_URL="http://localhost:4000"
DB_PORT="3306"
CONTAINER_APP="nestjs-app"
CONTAINER_DB="nestjs-mysql"

echo -e "${BLUE}Checking Docker environment...${NC}\n"

# Check if Docker is installed
echo -n "Checking Docker installation... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
echo -n "Checking Docker Compose installation... "
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if containers are running
echo -n "Checking if containers are running... "
if [ "$(docker ps -q -f name=${CONTAINER_APP})" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${YELLOW}Containers are not running. Start them with: npm run docker:up${MODE:+:dev}${NC}"
    exit 1
fi

# Check database container
echo -n "Checking database container... "
if [ "$(docker ps -q -f name=${CONTAINER_DB})" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Database container is not running!${NC}"
    exit 1
fi

# Check database health
echo -n "Checking database health... "
DB_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_DB} 2>/dev/null)
if [ "$DB_HEALTH" == "healthy" ]; then
    echo -e "${GREEN}✓${NC}"
elif [ "$DB_HEALTH" == "starting" ]; then
    echo -e "${YELLOW}Starting...${NC}"
    echo -e "${YELLOW}Database is still starting. This may take a few moments.${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Database is not healthy!${NC}"
fi

# Check application container
echo -n "Checking application container health... "
APP_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_APP} 2>/dev/null)
if [ "$APP_HEALTH" == "healthy" ]; then
    echo -e "${GREEN}✓${NC}"
elif [ "$APP_HEALTH" == "starting" ]; then
    echo -e "${YELLOW}Starting...${NC}"
    echo -e "${YELLOW}Application is still starting. This may take a few moments.${NC}"
else
    echo -e "${YELLOW}No health check configured or not ready yet${NC}"
fi

# Wait a moment for services to be fully ready
sleep 2

# Check API health endpoint
echo -n "Checking API health endpoint... "
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health 2>/dev/null)
if [ "$HEALTH_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}API health check failed (HTTP ${HEALTH_RESPONSE})${NC}"
    echo -e "${YELLOW}The API might still be starting up. Try again in a few seconds.${NC}"
fi

# Check if database port is accessible
echo -n "Checking database port (${DB_PORT})... "
if nc -z localhost ${DB_PORT} 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${YELLOW}Database port is not accessible from host${NC}"
fi

echo ""
echo -e "${BLUE}Container Status:${NC}"
docker ps --filter "name=nestjs" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Verification Complete!         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Service URLs:${NC}"
echo -e "  API: ${GREEN}${API_URL}${NC}"
echo -e "  API Health: ${GREEN}${API_URL}/health${NC}"
echo -e "  API Docs: ${GREEN}${API_URL}/docs${NC}"
echo -e "  Database: ${GREEN}localhost:${DB_PORT}${NC}"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs:     ${GREEN}npm run docker:logs${NC}"
echo -e "  Access shell:  ${GREEN}npm run docker:shell${NC}"
echo -e "  Run Prisma:    ${GREEN}npm run docker:prisma <command>${NC}"
echo -e "  Stop services: ${GREEN}npm run docker:down${NC}"
echo ""
