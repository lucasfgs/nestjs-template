# Docker Architecture Diagram

## 🏗️ Development Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HOST MACHINE (You)                          │
│                                                                     │
│  📂 Source Code: /nestjs-template/src                              │
│  📝 .env file with configurations                                   │
│  🔧 docker-compose.dev.yml                                         │
│                                                                     │
│  Commands:                                                          │
│    npm run docker:up:dev      → Start                              │
│    npm run docker:logs:dev    → View logs                          │
│    npm run docker:shell:dev   → Access container                   │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Docker Engine
                             │
     ┌───────────────────────┴────────────────────────┐
     │                                                 │
┌────▼─────────────────────────────┐  ┌──────────────▼──────────────┐
│   NestJS App (Development)       │  │   MySQL 8.0 Database         │
│   Container: nestjs-app-dev      │  │   Container: nestjs-mysql-dev│
├──────────────────────────────────┤  ├─────────────────────────────┤
│                                  │  │                              │
│  🔥 Hot Reload: ENABLED          │  │  📊 Port: 3307 (exposed)     │
│  📂 Volumes:                     │  │  💾 Volume: mysql_data_dev   │
│     - ./src → /app/src           │  │  ✅ Health Check: Active     │
│     - ./prisma → /app/prisma     │  │  🔐 User: nestjs_user        │
│     - node_modules (protected)   │  │  🗄️ Database: nestjs_db_dev  │
│                                  │  │                              │
│  🌐 Port: 4000 (exposed)         │  │  Connection:                 │
│  🏥 Health Check: /health        │  │    mysql://nestjs_user:***   │
│  🔧 Mode: Development            │  │    @mysql:3306/nestjs_db_dev │
│  📚 Docs: /docs (Swagger)        │  │                              │
│                                  │  │                              │
│  Environment:                    │  │  First Start:                │
│    NODE_ENV=development          │  │    - Creates database        │
│    DATABASE_URL=mysql://...      │  │    - Initializes tables      │
│                                  │  │                              │
│  Startup:                        │  │  Persistent:                 │
│    1. Wait for database          │  │    - Data survives restarts  │
│    2. prisma migrate dev         │  │    - Separate from prod DB   │
│    3. npm run start:dev          │  │                              │
│                                  │  │                              │
└──────────────┬───────────────────┘  └───────────────┬──────────────┘
               │                                      │
               └──────────────────┬───────────────────┘
                                  │
                      ┌───────────▼────────────┐
                      │  Docker Network (dev)  │
                      │  nestjs-network-dev    │
                      │  Type: bridge          │
                      └────────────────────────┘
```

## 🚀 Production Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HOST MACHINE (Server)                       │
│                                                                     │
│  📝 .env file with production configs                               │
│  🔧 docker-compose.yml                                             │
│  🔐 Secrets properly configured                                     │
│                                                                     │
│  Commands:                                                          │
│    npm run docker:up          → Start                              │
│    npm run docker:logs        → View logs                          │
│    npm run docker:verify      → Check health                       │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Docker Engine
                             │
     ┌───────────────────────┴────────────────────────┐
     │                                                 │
┌────▼─────────────────────────────┐  ┌──────────────▼──────────────┐
│   NestJS App (Production)        │  │   MySQL 8.0 Database         │
│   Container: nestjs-app          │  │   Container: nestjs-mysql    │
├──────────────────────────────────┤  ├─────────────────────────────┤
│                                  │  │                              │
│  🚀 Multi-Stage Build            │  │  📊 Port: 3306 (exposed)     │
│  👤 User: nestjs (non-root)      │  │  💾 Volume: mysql_data       │
│  📦 Size: ~200-300MB             │  │  ✅ Health Check: Active     │
│                                  │  │  🔐 User: nestjs_user        │
│  Layers:                         │  │  🗄️ Database: nestjs_db      │
│    1. Dependencies (~50MB)       │  │                              │
│    2. Build (~100MB)             │  │  Optimized:                  │
│    3. Production (~150MB)        │  │    - Innodb settings         │
│                                  │  │    - Buffer pool size        │
│  🌐 Port: 4000 (exposed)         │  │    - Connection pooling      │
│  🏥 Health Check: /health        │  │                              │
│  🔧 Mode: Production             │  │  Connection:                 │
│  📚 Docs: Disabled               │  │    mysql://nestjs_user:***   │
│                                  │  │    @mysql:3306/nestjs_db     │
│  Security:                       │  │                              │
│    - Non-root user (UID 1001)    │  │  Persistent:                 │
│    - Read-only filesystem (opt)  │  │    - Data in named volume    │
│    - No dev dependencies         │  │    - Backups recommended     │
│    - Minimal attack surface      │  │    - Replication ready       │
│                                  │  │                              │
│  Startup:                        │  │  Monitoring:                 │
│    1. Wait for database healthy  │  │    - Health checks every 10s │
│    2. prisma migrate deploy      │  │    - Auto restart on fail    │
│    3. node dist/main             │  │    - Logs to Docker driver   │
│                                  │  │                              │
│  Restart Policy:                 │  │  Restart Policy:             │
│    unless-stopped                │  │    unless-stopped            │
│                                  │  │                              │
└──────────────┬───────────────────┘  └───────────────┬──────────────┘
               │                                      │
               └──────────────────┬───────────────────┘
                                  │
                      ┌───────────▼────────────┐
                      │  Docker Network (prod) │
                      │  nestjs-network        │
                      │  Type: bridge          │
                      │  Isolated & Secure     │
                      └────────────────────────┘
```

## 🔄 Multi-Stage Build Process (Production)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Dockerfile Stages                            │
└─────────────────────────────────────────────────────────────────────┘

Stage 1: DEPENDENCIES                Stage 2: BUILD
┌──────────────────────────┐        ┌──────────────────────────┐
│  FROM node:22-alpine     │        │  FROM node:22-alpine     │
│                          │        │                          │
│  - Copy package.json     │        │  - Copy package.json     │
│  - Copy prisma/          │        │  - Install ALL deps      │
│  - npm ci (prod only)    │        │  - Copy source code      │
│  - Generate Prisma       │        │  - Generate Prisma       │
│                          │        │  - Build application     │
│  Output: node_modules/   │        │  - TypeScript → JS       │
│         (production)     │        │                          │
│                          │        │  Output: dist/           │
│  Size: ~150MB            │        │                          │
└──────────────────────────┘        │  Size: ~300MB            │
                                    └──────────────────────────┘
                                               │
                                               ▼
                              Stage 3: PRODUCTION (FINAL)
                              ┌──────────────────────────┐
                              │  FROM node:22-alpine     │
                              │                          │
                              │  - Create nestjs user    │
                              │  - Copy from deps stage  │
                              │  - Copy from build stage │
                              │  - Set permissions       │
                              │  - Health check          │
                              │                          │
                              │  Contains:               │
                              │    ✓ node_modules/       │
                              │    ✓ dist/               │
                              │    ✓ prisma/             │
                              │    ✗ src/ (excluded)     │
                              │    ✗ tests/ (excluded)   │
                              │                          │
                              │  Final Size: ~200MB      │
                              └──────────────────────────┘
                                        │
                                        ▼
                              🐳 Ready for deployment!
```

## 📊 Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     Request Flow (Development)                    │
└──────────────────────────────────────────────────────────────────┘

Client Request
     │
     ▼
http://localhost:4000/users
     │
     ▼
┌─────────────────┐
│  Docker Network │  (nestjs-network-dev)
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│  NestJS Container          │
│  - Receives request        │
│  - Validates JWT           │
│  - Checks permissions      │
│  - Runs business logic     │
└─────────┬──────────────────┘
          │
          ▼ Prisma Query
┌────────────────────────────┐
│  MySQL Container           │
│  - Executes SQL            │
│  - Returns data            │
└─────────┬──────────────────┘
          │
          ▼ Result
┌────────────────────────────┐
│  NestJS Container          │
│  - Transforms response     │
│  - Applies interceptors    │
│  - Returns JSON            │
└─────────┬──────────────────┘
          │
          ▼
     Client Response
   { data: [...] }
```

## 🔧 Volume Mappings

```
┌────────────────────────────────────────────────────────────────┐
│                    Development Volumes                         │
└────────────────────────────────────────────────────────────────┘

HOST                          CONTAINER                PURPOSE
────────────────────────────────────────────────────────────────
./src/            →  /app/src/              Hot reload
./prisma/         →  /app/prisma/           Schema changes
./test/           →  /app/test/             Tests
node_modules      ↔  (internal volume)      Prevent overwrite
dist              ↔  (internal volume)      Build output

mysql_data_dev    ↔  /var/lib/mysql         Database persistence

┌────────────────────────────────────────────────────────────────┐
│                    Production Volumes                          │
└────────────────────────────────────────────────────────────────┘

HOST                          CONTAINER                PURPOSE
────────────────────────────────────────────────────────────────
mysql_data        ↔  /var/lib/mysql         Database persistence

(No source code volumes - everything is in the image)
```

## 🎯 Comparison: Dev vs Prod

```
┌────────────────────┬──────────────────────┬──────────────────────┐
│     Feature        │     Development      │     Production       │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Image Build        │ Simple (1 stage)     │ Multi-stage (3)      │
│ Image Size         │ ~1.2 GB              │ ~200-300 MB          │
│ Build Time         │ 2-3 minutes          │ 3-5 minutes          │
│ Hot Reload         │ ✅ Enabled            │ ❌ Disabled           │
│ Source Volumes     │ ✅ Mounted            │ ❌ None               │
│ Dependencies       │ All (dev + prod)     │ Production only      │
│ Database Port      │ 3307                 │ 3306                 │
│ Database Name      │ nestjs_db_dev        │ nestjs_db            │
│ Swagger Docs       │ ✅ /docs              │ ❌ Disabled           │
│ Debug Logs         │ ✅ Verbose            │ ⚠️  Production level  │
│ User              │ root                 │ nestjs (non-root)    │
│ Security          │ Relaxed              │ Hardened             │
│ Optimizations     │ None                 │ Many                 │
│ Use Case          │ Local development    │ Server deployment    │
└────────────────────┴──────────────────────┴──────────────────────┘
```

---

This architecture provides:

- ✅ Complete isolation between environments
- ✅ Easy local development with hot reload
- ✅ Production-ready optimized builds
- ✅ Security best practices
- ✅ Scalability and maintainability
- ✅ Simple deployment process
