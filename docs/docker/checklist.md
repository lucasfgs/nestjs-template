# 📋 Docker Setup Checklist

Use this checklist to ensure your Docker setup is complete and working correctly.

## ✅ Pre-Setup Checklist

- [ ] Docker is installed (v20.10+)
  ```bash
  docker --version
  ```

- [ ] Docker Compose is installed (v2.0+)
  ```bash
  docker-compose --version
  ```

- [ ] Docker daemon is running
  ```bash
  docker ps
  ```

- [ ] You have sufficient disk space (at least 5GB free)
  ```bash
  df -h
  ```

## ✅ Environment Setup Checklist

- [ ] Environment file created
  ```bash
  cp .env-example .env
  ```

- [ ] Updated `JWT_ACCESS_SECRET` in `.env`
  - [ ] Changed from default value
  - [ ] At least 32 characters long
  - [ ] Randomly generated

- [ ] Updated `JWT_REFRESH_SECRET` in `.env`
  - [ ] Changed from default value
  - [ ] At least 32 characters long
  - [ ] Different from JWT_ACCESS_SECRET

- [ ] Updated `SESSION_SECRET` in `.env`
  - [ ] Changed from default value
  - [ ] At least 32 characters long

- [ ] Configured database credentials (optional for dev)
  - [ ] `DB_ROOT_PASSWORD`
  - [ ] `DB_PASSWORD`
  - [ ] `DB_USER`
  - [ ] `DB_NAME`

- [ ] Verified CORS settings
  - [ ] `CORS_ALLOWED_URLS` includes your frontend URL
  - [ ] Multiple URLs separated by commas if needed

## ✅ Docker Files Checklist

Verify all Docker files exist:

- [ ] `Dockerfile` exists
- [ ] `Dockerfile.dev` exists
- [ ] `docker-compose.yml` exists
- [ ] `docker-compose.dev.yml` exists
- [ ] `.dockerignore` exists
- [ ] `.env` file exists (created from `.env-example`)

Scripts exist and are executable:
- [ ] `docker/compose-up.sh`
- [ ] `docker/compose-down.sh`
- [ ] `docker/logs.sh`
- [ ] `docker/shell.sh`
- [ ] `docker/prisma.sh`
- [ ] `docker/rebuild.sh`
- [ ] `docker/verify.sh`

```bash
# Verify scripts are executable
ls -la docker/*.sh
```

## ✅ First Run Checklist

- [ ] Started Docker containers
  ```bash
  npm run docker:up:dev
  ```

- [ ] Containers are running
  ```bash
  docker ps
  ```
  Should see:
  - `nestjs-app-dev`
  - `nestjs-mysql-dev`

- [ ] Database is healthy
  ```bash
  docker ps | grep mysql
  ```
  Status should show "healthy"

- [ ] Application is healthy
  ```bash
  npm run docker:verify:dev
  ```

- [ ] API responds
  ```bash
  curl http://localhost:4000/health
  ```
  Should return 200 OK

- [ ] Swagger docs accessible
  - [ ] Open browser to http://localhost:4000/docs
  - [ ] Can see API documentation

## ✅ Database Setup Checklist

- [ ] Run Prisma migrations
  ```bash
  npm run docker:prisma:dev migrate dev
  ```

- [ ] Seed database (optional)
  ```bash
  npm run docker:prisma:dev db seed
  ```

- [ ] Verify database connection
  ```bash
  npm run docker:prisma:dev studio
  ```
  - [ ] Prisma Studio opens at http://localhost:5555
  - [ ] Can see database tables
  - [ ] Can see seeded data (if seeded)

## ✅ Development Workflow Checklist

- [ ] Hot reload works
  - [ ] Make a change in `src/`
  - [ ] Check logs: `npm run docker:logs:dev`
  - [ ] Verify application restarted
  - [ ] Test the change

- [ ] Can view logs
  ```bash
  npm run docker:logs:dev
  ```

- [ ] Can access container shell
  ```bash
  npm run docker:shell:dev
  ```

- [ ] Can run npm commands in container
  ```bash
  npm run docker:shell:dev
  # Then inside container:
  npm run test
  ```

## ✅ API Testing Checklist

Test endpoints using the Swagger UI or curl:

- [ ] Health endpoint works
  ```bash
  curl http://localhost:4000/health
  ```

- [ ] Can register a user (if enabled)
  ```bash
  curl -X POST http://localhost:4000/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
  ```

- [ ] Can login
  ```bash
  curl -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  ```

- [ ] Protected routes work with JWT
  - [ ] Get access token from login
  - [ ] Use token to access protected endpoint

## ✅ Common Operations Checklist

- [ ] Restart containers
  ```bash
  npm run docker:down:dev
  npm run docker:up:dev
  ```

- [ ] Rebuild images after dependency change
  ```bash
  npm run docker:rebuild:dev
  npm run docker:up:dev
  ```

- [ ] View specific service logs
  ```bash
  bash docker/logs.sh dev app    # Application only
  bash docker/logs.sh dev mysql  # Database only
  ```

- [ ] Check container status
  ```bash
  docker ps
  docker stats  # Resource usage
  ```

## ✅ Troubleshooting Checklist

If something doesn't work:

- [ ] Check logs for errors
  ```bash
  npm run docker:logs:dev
  ```

- [ ] Verify environment variables are set
  ```bash
  cat .env | grep SECRET
  ```

- [ ] Check if ports are available
  ```bash
  lsof -i :4000  # API port
  lsof -i :3307  # Dev database port
  ```

- [ ] Verify database is healthy
  ```bash
  docker inspect nestjs-mysql-dev | grep Status
  ```

- [ ] Try rebuilding
  ```bash
  npm run docker:rebuild:dev
  ```

- [ ] Try fresh start
  ```bash
  docker-compose -f docker-compose.dev.yml down -v
  npm run docker:up:dev
  ```

## ✅ Production Checklist

Before deploying to production:

- [ ] All secrets changed from defaults
- [ ] Environment variables configured for production
- [ ] CORS URLs updated for production domain
- [ ] Database credentials are strong
- [ ] SSL/TLS configured (if needed)
- [ ] Backup strategy in place for database
- [ ] Monitoring and logging configured
- [ ] Health checks working
- [ ] Resource limits set (if needed)

- [ ] Test production build locally
  ```bash
  npm run docker:up
  npm run docker:verify
  ```

- [ ] Test migrations
  ```bash
  npm run docker:prisma migrate deploy
  ```

## ✅ Documentation Checklist

Have you read:

- [ ] [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Quick setup guide
- [ ] [DOCKER.md](./DOCKER.md) - Complete documentation
- [ ] [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md) - Architecture overview
- [ ] [docker/README.md](./docker/README.md) - Scripts documentation

## ✅ Final Verification

Run the complete verification:

```bash
npm run docker:verify:dev
```

All checks should pass:
- [ ] ✓ Docker installation
- [ ] ✓ Docker Compose installation
- [ ] ✓ Containers running
- [ ] ✓ Database container healthy
- [ ] ✓ Application container healthy
- [ ] ✓ API health endpoint responding
- [ ] ✓ Database port accessible

---

## 🎉 Success!

If all items are checked, your Docker setup is complete and working!

### Next Steps:
1. Start developing your features
2. Use `npm run docker:logs:dev` to debug
3. Use `npm run docker:prisma:dev` for database operations
4. Refer to documentation when needed

### Get Help:
- Check [DOCKER.md](./DOCKER.md) troubleshooting section
- View logs: `npm run docker:logs:dev`
- Access shell: `npm run docker:shell:dev`
- Review [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md) for architecture details

---

**Happy coding! 🚀**
