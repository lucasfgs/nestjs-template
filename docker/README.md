# Docker Helper Scripts

This directory contains utility scripts to simplify Docker operations.

## 📜 Available Scripts

### compose-up.sh

Start Docker Compose services (development or production).

```bash
# Production
bash docker/compose-up.sh
# or
npm run docker:up

# Development
bash docker/compose-up.sh dev
# or
npm run docker:up:dev
```

**Features:**

- Checks for `.env` file
- Builds and starts containers
- Shows service status
- Provides access URLs

---

### compose-down.sh

Stop Docker Compose services.

```bash
# Production
bash docker/compose-down.sh
# or
npm run docker:down

# Development
bash docker/compose-down.sh dev
# or
npm run docker:down:dev
```

**Features:**

- Graceful shutdown
- Option to remove volumes
- Supports dev/prod modes

---

### logs.sh

View container logs in follow mode.

```bash
# All services (dev)
bash docker/logs.sh dev
# or
npm run docker:logs:dev

# Specific service
bash docker/logs.sh dev app    # Application logs only
bash docker/logs.sh dev mysql  # Database logs only
```

**Features:**

- Follow mode by default
- Can filter by service
- Colored output

---

### shell.sh

Access the application container shell.

```bash
# Production
bash docker/shell.sh
# or
npm run docker:shell

# Development
bash docker/shell.sh dev
# or
npm run docker:shell:dev
```

**Features:**

- Interactive shell access
- Useful for debugging
- Run any command inside container

---

### prisma.sh

Run Prisma CLI commands inside the container.

```bash
# Development examples
npm run docker:prisma:dev migrate dev
npm run docker:prisma:dev db seed
npm run docker:prisma:dev studio

# Production examples
npm run docker:prisma migrate deploy
npm run docker:prisma generate
```

**Features:**

- Execute any Prisma command
- Automatically connects to container database
- No need to install Prisma locally

---

### rebuild.sh

Rebuild Docker images without cache.

```bash
# Production
bash docker/rebuild.sh
# or
npm run docker:rebuild

# Development
bash docker/rebuild.sh dev
# or
npm run docker:rebuild:dev
```

**Features:**

- Force rebuild without cache
- Useful after dependency changes
- Clean build process

---

### verify.sh

Verify Docker setup and health status.

```bash
# Production
bash docker/verify.sh
# or
npm run docker:verify

# Development
bash docker/verify.sh dev
# or
npm run docker:verify:dev
```

**Features:**

- Checks Docker installation
- Verifies container status
- Tests database health
- Checks API endpoints
- Shows service URLs
- Provides useful debugging info

---

## 🎨 Color Coding

All scripts use colored output for better visibility:

- 🟢 **Green**: Success messages
- 🔵 **Blue**: Information messages
- 🔴 **Red**: Error messages
- 🟡 **Yellow**: Warning messages

## 🔧 Script Permissions

All scripts are executable:

```bash
chmod +x docker/*.sh
```

## 📝 Notes

- All scripts support both dev and production modes
- Pass `dev` or `development` as first argument for dev mode
- Scripts check prerequisites before running
- Error handling included in all scripts
- Colored output for better UX

## 💡 Tips

1. **Always verify after starting:**

   ```bash
   npm run docker:verify:dev
   ```

2. **View logs when debugging:**

   ```bash
   npm run docker:logs:dev
   ```

3. **Access shell for manual commands:**

   ```bash
   npm run docker:shell:dev
   ```

4. **Rebuild after dependency changes:**
   ```bash
   npm run docker:rebuild:dev
   ```

---

For complete Docker documentation, see:

- [DOCKER_QUICKSTART.md](../DOCKER_QUICKSTART.md)
- [DOCKER.md](../DOCKER.md)
