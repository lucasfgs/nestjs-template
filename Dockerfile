# Development Dockerfile with hot reload
FROM node:22

WORKDIR /app

# Copy package files and config files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Expose the application port
EXPOSE 4000

# Start in development mode with hot reload
CMD ["sh", "-c", "npm install && npx prisma generate && npm run start:dev"]
