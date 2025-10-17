# 🚀 Quick Start Guide - Docker Setup

Get your NestJS application running with Docker in 3 simple steps!

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)

Check if you have them:

```bash
docker --version
docker compose version
```

## 🏃 Quick Start

```bash
# 1. Copy environment template
cp .env-example .env

# 2. Edit .env and update the secrets (IMPORTANT!)
# At minimum, change: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET

# 3. Start Docker services
npm run docker:up

# 4. Verify everything is working
npm run docker:verify
```

**That's it!** Your API is now running at **http://localhost:4000**

## 🔍 Verify Installation

Run the verification script to check if everything is working:

```bash
npm run docker:verify
```

## 📊 Access Your Services

- **API:** http://localhost:4000
- **API Health:** http://localhost:4000/health
- **API Docs:** http://localhost:4000/docs
- **Database:** localhost:3306

## 🛠️ Common Commands

```bash
# View logs
npm run docker:logs

# Access container shell
npm run docker:shell

# Run Prisma commands
npm run docker:prisma studio
npm run docker:prisma migrate dev

# Stop services
npm run docker:down

# Restart services
npm run docker:down && npm run docker:up
```

## ⚙️ Environment Variables

**Required** environment variables to change in `.env`:

```env
# IMPORTANT: Change these secrets!
JWT_ACCESS_SECRET=your-strong-random-secret-here
JWT_REFRESH_SECRET=your-strong-random-secret-here
SESSION_SECRET=your-strong-random-secret-here

# Database credentials (optional to change for development)
DB_ROOT_PASSWORD=rootpassword
DB_PASSWORD=nestjs_password
```

Generate strong secrets:

```bash
# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🐛 Troubleshooting

### Port already in use

```bash
# Stop existing containers
npm run docker:down

# Or change ports in .env
DB_PORT=3307
API_PORT=4001
```

### Database connection issues

```bash
# Check logs
npm run docker:logs mysql

# Wait for database to be healthy (10-20 seconds)
docker ps  # Check if status is "healthy"
```

### Application not starting

```bash
# Check application logs
npm run docker:logs app

# Rebuild images
npm run docker:rebuild
npm run docker:up
```

### Start fresh

```bash
# Remove everything and start over
docker compose down -v
docker system prune -a
npm run docker:up
```

## 📚 Next Steps

1. **Run migrations:**

   ```bash
   npm run docker:prisma migrate dev
   ```

2. **Seed database:**

   ```bash
   npm run docker:prisma db seed
   ```

3. **View data with Prisma Studio:**

   ```bash
   npm run docker:prisma studio
   ```

   Access at: http://localhost:5555

4. **Test the API:**
   - Visit http://localhost:4000/docs for API documentation
   - Visit http://localhost:4000/health to check health status

## 📖 Full Documentation

For detailed documentation, see [full-guide.md](./full-guide.md)

## 💡 Pro Tips

- Your code changes in `src/` are automatically reflected (hot reload enabled)
- Use `npm run docker:logs` to debug issues
- The setup includes volume mounts for seamless development experience

---

**Happy coding! 🎉**
