# MyRentersGuide Serverless Functions

This directory contains the standalone JavaScript implementation of the serverless functions, separated from the main NestJS application.

## Overview

This serverless implementation provides the same functionality as the NestJS handlers but with:

- Pure JavaScript (no TypeScript compilation needed)
- Minimal dependencies for faster cold starts
- Direct Prisma Client usage without NestJS overhead
- Simplified logging and error handling

## Functions

### 1. S3 Handler (`src/handlers/s3.js`)

Handles S3 ObjectCreated events:

- Generates image conversions (thumb, hero, default, hero_mobile) for uploaded media
- Updates database with conversion status

## Services

### PrismaService

- Simple wrapper around Prisma Client
- Handles connection lifecycle
- Provides database logging

### MediaService

- Media file management
- S3 operations (upload, delete, download)
- Image conversion using Sharp
- Database operations for media records

### MediaCronService

- Background task coordination
- Media cleanup operations

### Logger

- Simple console-based logging
- Timestamped log entries

## Setup

1. Install dependencies:

   ```bash
   cd serverless
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate --schema ../prisma/schema.prisma
   ```

## Deployment

```bash
# Deploy to staging
npm run deploy

# Deploy to production
npm run deploy -- --stage production
```

## Local Testing

```bash
# Test S3 event handling
yarn invoke:s3

```

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL connection string
- `AWS_S3_BUCKET`: S3 bucket name for media storage
- `AWS_REGION`: AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_CLOUDFRONT_MEDIA_URL`: CloudFront distribution URL
- `NODE_ENV`: Environment (development/staging/production)

## File Structure

```

serverless/
├── src/
│ ├── handlers/
│ │ ├── s3.js # S3 event handler
│ └── services/
│ ├── logger.js # Simple logging utility
│ ├── prisma.js # Prisma client wrapper
│ ├── media.js # Media file operations
│ ├── media-cron.js # Cron task operations
│ └── stats-cache-warming.js # Stats cache warming service
├── test-events/
│ ├── s3-event.json # Sample S3 event for testing
├── package.json
├── serverless.yml
└── README.md

```
