# Docker

This section covers the Docker setup for the NestJS backend application. Docker provides a complete containerized environment with all dependencies, including the MySQL database.

## Quick Start

Get your application running with Docker in 3 simple steps:

1. **Copy the environment template:**

   ```bash
   cp .env-example .env
   ```

2. **Update the `.env` file with your secrets** (at minimum: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`)

3. **Start the development environment:**
   ```bash
   npm run docker:up:dev
   ```

Your API will be running at **http://localhost:4000** with a MySQL database at **localhost:3307**.

## Documentation Overview

- [**Quick Start Guide**](./quickstart.md) - Get up and running in minutes
- [**Full Guide**](./full-guide.md) - Complete Docker documentation with all features
- [**Architecture**](./architecture.md) - Visual diagrams and technical details
- [**Checklist**](./checklist.md) - Step-by-step verification checklist
- [**Implementation**](./implementation.md) - Technical implementation details

## Available Commands

### Development

```bash
npm run docker:up:dev          # Start development environment
npm run docker:down:dev        # Stop development environment
npm run docker:logs:dev        # View logs
npm run docker:shell:dev       # Access container shell
npm run docker:prisma:dev      # Run Prisma commands
npm run docker:verify:dev      # Verify setup
```

### Production

```bash
npm run docker:up              # Start production environment
npm run docker:down            # Stop production environment
npm run docker:logs            # View logs
npm run docker:shell           # Access container shell
npm run docker:prisma          # Run Prisma commands
npm run docker:verify          # Verify setup
```

## Key Features

### Development Environment

- ✅ Hot reload enabled
- ✅ Source code mounted as volumes
- ✅ Separate database (port 3307)
- ✅ Full dev dependencies
- ✅ Easy debugging

### Production Environment

- ✅ Multi-stage optimized build (~200MB)
- ✅ Non-root user security
- ✅ Health checks
- ✅ Automatic migrations
- ✅ Production-only dependencies

### Both Environments

- ✅ MySQL 8.0 database included
- ✅ Persistent data volumes
- ✅ One-command setup
- ✅ Complete isolation

## What's Included

The Docker setup includes:

1. **Dockerfile** - Production multi-stage build
2. **Dockerfile.dev** - Development with hot reload
3. **docker-compose.yml** - Production orchestration
4. **docker-compose.dev.yml** - Development orchestration
5. **Helper Scripts** - 7 bash scripts in `docker/` directory
6. **14 NPM Scripts** - Easy commands for common operations

## Next Steps

1. Read the [Quick Start Guide](./quickstart.md)
2. Start your development environment
3. Check the [Full Guide](./full-guide.md) for advanced features
4. Review the [Architecture](./architecture.md) to understand the setup
5. Use the [Checklist](./checklist.md) to verify everything works

## Getting Help

If you encounter issues:

- Check the [Full Guide - Troubleshooting](./full-guide.md#troubleshooting)
- View logs: `npm run docker:logs:dev`
- Verify setup: `npm run docker:verify:dev`
- Access container shell: `npm run docker:shell:dev`

---

For more information, explore the documentation links above.
