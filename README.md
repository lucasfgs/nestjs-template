# Backend API

A NestJS-based backend API with authentication, role-based access control, and comprehensive Docker support. This is part of a full-stack application with a [Next.js frontend](https://github.com/lucasfgs/nextjs14-dashboard-with-nest-api-template).

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 Role-based access control (RBAC)
- 🔄 Automatic token refresh
- 🍪 Secure cookie-based token storage
- 🛡️ CORS configuration for frontend integration
- 📝 Swagger API documentation
- 🗄️ Prisma ORM with MySQL
- 🔍 Request validation and error handling
- 🐳 Docker support for seamless development

## 🚀 Quick Start

### Using Docker (Recommended)

The easiest way to get started! Docker includes everything: database, application, and all dependencies.

```bash
# 1. Copy environment template
cp .env-example .env

# 2. Edit .env and update:
#    - DATABASE_URL: Change 'localhost' to 'mysql' (DATABASE_URL=mysql://root:rootpassword@mysql:3306/nestjs_db)
#    - JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET

# 3. Start Docker services
npm run docker:up
```

Your API is now running at **http://localhost:4000** 🎉

**📚 For complete Docker documentation, run:**

```bash
npm run start:docs
```

Then navigate to the "Docker" section in the documentation.

### Without Docker

## Prerequisites

- Node.js (v22 or higher)
- MySQL (v8.0 or higher)
- npm package manager

**Setup:**

1. Install dependencies: `npm install`
2. Copy `.env-example` to `.env` and configure
3. Run migrations: `npm run prisma migrate dev`
4. Start the app: `npm run start:dev`

## 📚 Documentation

This project uses Compodoc for comprehensive documentation.

**Start the documentation server:**

```bash
npm run start:docs
```

Then visit **http://localhost:8080** to access:

- 🐳 **Docker Setup** - Complete guide to containerized development
- 🔐 **Authentication** - Auth flows and OAuth integration
- 🧪 **Testing** - Test structure, coverage, and best practices
- 📖 **API Documentation** - Full API reference with Swagger

## 🔑 Common Commands

```bash
# Development
npm run start:dev              # Start in development mode
npm run docker:up              # Start with Docker

# Database
npm run prisma migrate dev     # Run migrations
npm run prisma studio          # Open Prisma Studio

# Testing
npm test                       # Run unit tests
npm run test:e2e              # Run E2E tests
npm run test:cov              # Generate coverage

# Documentation
npm run start:docs             # Start Compodoc server
```

## 📖 API Documentation

Swagger documentation is available when the application is running:

- **URL:** http://localhost:4000/docs
- Includes all endpoints, request/response schemas, and authentication

## 🏗️ Project Structure

```
src/
├── modules/
│   ├── api/
│   │   ├── core/              # Core modules (auth, users, roles)
│   │   ├── health/            # Health check endpoints
│   │   └── payment/           # Payment integration
│   ├── app/                   # Application module
│   └── shared/                # Shared modules (prisma, events)
├── common/                    # Common utilities
│   ├── decorators/            # Custom decorators
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Interceptors
│   └── middlewares/           # Middlewares
├── configs/                   # Configuration files
└── main.ts                    # Application entry point
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is [MIT licensed](LICENSE).
