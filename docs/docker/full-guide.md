# Docker Setup for NestJS Project

This project includes a complete Docker setup for both development and production environments.

## 📋 Prerequisites

- Docker (v20.10 or higher)
- Docker Compose (v2.0 or higher)

## 🚀 Quick Start

### Development Environment

1. **Copy the environment template:**
   ```bash
   cp .env-example .env
   ```

2. **Update the `.env` file with your values** (especially the secrets!)

3. **Start the development environment:**
   ```bash
   npm run docker:up:dev
   ```

   Or using the script directly:
   ```bash
   bash docker/compose-up.sh dev
   ```

4. **Access your application:**
   - API: http://localhost:4000
   - Database: localhost:3307
   - Hot reload is enabled - changes to `src/` will automatically restart the app

### Production Environment

1. **Ensure your `.env` file is configured**

2. **Start the production environment:**
   ```bash
   npm run docker:up
   ```

   Or using the script directly:
   ```bash
   bash docker/compose-up.sh
   ```

3. **Access your application:**
   - API: http://localhost:4000
   - Database: localhost:3306

## 📦 What's Included

### Services

1. **MySQL Database (mysql:8.0)**
   - Development: Port 3307
   - Production: Port 3306
   - Persistent volumes for data storage
   - Health checks configured

2. **NestJS Application**
   - Multi-stage build for production (optimized image size)
   - Development mode with hot reload
   - Automatic Prisma migrations on startup
   - Health checks configured

### Files Structure

```
├── Dockerfile                  # Production multi-stage build
├── Dockerfile.dev             # Development with hot reload
├── docker-compose.yml         # Production compose file
├── docker-compose.dev.yml     # Development compose file
├── .dockerignore              # Files to exclude from Docker build
├── .env-example                # Environment template
└── docker/
    ├── compose-up.sh          # Start containers script
    ├── compose-down.sh        # Stop containers script
    ├── logs.sh                # View container logs
    ├── shell.sh               # Access container shell
    ├── prisma.sh              # Run Prisma commands
    └── rebuild.sh             # Rebuild Docker images
```

## 🛠️ Available Commands

### NPM Scripts

```bash
# Development
npm run docker:up:dev          # Start development environment
npm run docker:down:dev        # Stop development environment
npm run docker:logs:dev        # View development logs
npm run docker:shell:dev       # Access development container shell
npm run docker:prisma:dev      # Run Prisma commands in dev
npm run docker:rebuild:dev     # Rebuild development images

# Production
npm run docker:up              # Start production environment
npm run docker:down            # Stop production environment
npm run docker:logs            # View production logs
npm run docker:shell           # Access production container shell
npm run docker:prisma          # Run Prisma commands in prod
npm run docker:rebuild         # Rebuild production images
```

### Direct Script Usage

```bash
# Start services
bash docker/compose-up.sh [dev]

# Stop services
bash docker/compose-down.sh [dev]

# View logs (follow mode)
bash docker/logs.sh [dev] [service-name]

# Access container shell
bash docker/shell.sh [dev]

# Run Prisma commands
bash docker/prisma.sh [dev] <command>
# Examples:
bash docker/prisma.sh dev migrate dev
bash docker/prisma.sh studio

# Rebuild images
bash docker/rebuild.sh [dev]
```

## 🔧 Common Tasks

### Database Migrations

**Development:**
```bash
npm run docker:prisma:dev migrate dev --name your-migration-name
```

**Production:**
```bash
npm run docker:prisma migrate deploy
```

### Viewing Logs

**All services:**
```bash
npm run docker:logs:dev
```

**Specific service:**
```bash
bash docker/logs.sh dev app    # Application logs only
bash docker/logs.sh dev mysql  # Database logs only
```

### Accessing the Container Shell

```bash
npm run docker:shell:dev
```

Inside the container, you can run any npm or Prisma command:
```bash
npm run test
npx prisma studio
```

### Prisma Studio

```bash
npm run docker:prisma:dev studio
```

Then access: http://localhost:5555

### Seed Database

```bash
npm run docker:prisma:dev db seed
```

### Reset Database (Development Only!)

```bash
npm run docker:prisma:dev migrate reset
```

## 🌍 Environment Variables

Key environment variables for Docker:

```env
# Database
DB_ROOT_PASSWORD=rootpassword
DB_NAME=nestjs_db
DB_USER=nestjs_user
DB_PASSWORD=nestjs_password
DB_PORT=3306

# Application
NODE_ENV=production
API_PORT=4000
API_URL=http://localhost:4000
APP_URL=http://localhost:3000

# Authentication (CHANGE THESE!)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
SESSION_SECRET=your-secret-here
```

**⚠️ Important:** Always use strong, unique secrets in production!

## 🐛 Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. **Check running containers:**
   ```bash
   docker ps
   ```

2. **Stop conflicting containers:**
   ```bash
   npm run docker:down:dev
   ```

3. **Or change the port in `.env`:**
   ```env
   API_PORT=4001
   DB_PORT=3308
   ```

### Database Connection Issues

1. **Wait for database to be ready:**
   The application waits for MySQL health check to pass. This usually takes 10-20 seconds on first start.

2. **Check database logs:**
   ```bash
   bash docker/logs.sh dev mysql
   ```

3. **Verify DATABASE_URL:**
   The DATABASE_URL is automatically constructed in docker-compose. Make sure DB credentials in `.env` match.

### Permission Issues

If you encounter permission errors:

```bash
sudo chown -R $USER:$USER .
```

### Rebuild Images After Changes

If you modify Dockerfile or dependencies:

```bash
npm run docker:rebuild:dev
npm run docker:up:dev
```

### Clear Everything and Start Fresh

```bash
# Stop and remove all containers, volumes, and networks
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a --volumes

# Start again
npm run docker:up:dev
```

## 📊 Docker Compose Features

### Development Mode Features

- **Hot Reload:** Source code is mounted as volume
- **Live Debugging:** Port 4000 is exposed for debugging
- **Prisma Migrations:** Automatic `prisma migrate dev` on startup
- **Separate Database:** Uses port 3307 to avoid conflicts
- **Node Modules Protection:** node_modules is not overwritten by volume mount

### Production Mode Features

- **Multi-stage Build:** Optimized image size (~200MB vs ~1GB)
- **Security:** Non-root user (nestjs:nodejs)
- **Health Checks:** Application and database health monitoring
- **Automatic Migrations:** `prisma migrate deploy` on startup
- **Production Dependencies:** Only production npm packages included
- **Layer Caching:** Efficient rebuild with Docker layer caching

## 🔐 Security Best Practices

1. **Never commit `.env` file** - it's already in `.gitignore`
2. **Use strong secrets** - generate random strings for JWT secrets
3. **Update default passwords** - change all default passwords in `.env`
4. **Use environment-specific files** - different secrets for dev/staging/prod
5. **Scan images** - use `docker scan` to check for vulnerabilities
6. **Keep images updated** - regularly update base images

## 📈 Performance Tips

### Optimize Build Times

1. **Use Docker layer caching:**
   - Only change `package.json` when needed
   - Keep Dockerfile instructions in order of least to most frequently changed

2. **Build context optimization:**
   - `.dockerignore` excludes unnecessary files
   - Keep the context size small

### Optimize Runtime

1. **Use production images** for deployment
2. **Set appropriate resource limits** in production
3. **Use Docker BuildKit:**
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build
   ```

## 🚢 Deployment

### Building for Production

```bash
# Build the production image
docker build -t your-registry/nestjs-app:latest .

# Test the image locally
docker run -p 4000:4000 --env-file .env your-registry/nestjs-app:latest

# Push to registry
docker push your-registry/nestjs-app:latest
```

### Docker Registry

Tag and push to your container registry:

```bash
docker tag nestjs-app:latest your-registry.com/nestjs-app:v1.0.0
docker push your-registry.com/nestjs-app:v1.0.0
```

## 📝 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

## 💡 Tips

- Use `docker-compose logs -f` to follow logs in real-time
- Use `docker-compose ps` to check service status
- Use `docker-compose exec app sh` to access the container
- Use `docker system prune` regularly to free up space
- Set up CI/CD pipelines to automate Docker builds

---

**Happy Dockerizing! 🐳**
