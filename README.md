# Backend API

A NestJS-based backend API with authentication, role-based access control, and more. This is part of a full-stack application with a [Next.js frontend](https://github.com/lucasfgs/nextjs14-dashboard-with-nest-api-template).

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 Role-based access control (RBAC)
- 🔄 Automatic token refresh
- 🍪 Secure cookie-based token storage
- 🛡️ CORS configuration for frontend integration
- 📝 Swagger API documentation
- 🗄️ Prisma ORM with PostgreSQL
- 🔍 Request validation and error handling

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Yarn package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:3000"

# Server
PORT=4000
```

## Installation

```bash
# Install dependencies
$ yarn install

# Generate Prisma client
$ yarn prisma generate

# Run database migrations
$ yarn prisma migrate dev
```

## Running the app

```bash
# Development
$ yarn start

# Watch mode
$ yarn start:dev

# Production mode
$ yarn start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:4000/docs
```

## Authentication Flow

1. **Login**

   - Endpoint: `POST /auth/login`
   - Sets both access and refresh tokens as cookies
   - Access token is not httpOnly for frontend access
   - Refresh token is httpOnly for security

2. **Token Refresh**

   - Endpoint: `POST /auth/refresh`
   - Uses refresh token from cookies
   - Returns new access token
   - Automatically handled by frontend

3. **Protected Routes**
   - Use `@Public()` decorator to mark public routes
   - All other routes require valid access token
   - Token is validated via `JwtAuthGuard`

## Error Handling

- Global exception filter for consistent error responses
- Validation pipe for request body validation
- Custom exception classes for specific error cases

## Testing

```bash
# Unit tests
$ yarn test

# E2E tests
$ yarn test:e2e

# Test coverage
$ yarn test:cov
```

## Project Structure

```
src/
├── modules/
│   ├── api/
│   │   ├── core/
│   │   │   ├── auth/         # Authentication module
│   │   │   ├── users/        # User management
│   │   │   └── roles/        # Role management
│   │   └── ...
│   └── ...
├── shared/
│   ├── prisma/              # Database configuration
│   └── ...
└── main.ts                  # Application entry point
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is [MIT licensed](LICENSE).
