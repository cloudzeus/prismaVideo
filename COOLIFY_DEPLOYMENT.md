# Coolify Deployment Guide

This guide will help you deploy your Next.js video conference application to Coolify using Docker.

## Prerequisites

- Coolify server access
- External MySQL database (already configured)
- All environment variables properly set

## Files Created

1. **Dockerfile** - Multi-stage build optimized for Next.js 15.3.4
2. **docker-compose.yml** - Container orchestration (without MySQL)
3. **.dockerignore** - Optimizes build context
4. **src/app/api/health/route.ts** - Health check endpoint

## Environment Variables

Make sure you have these environment variables set in Coolify:

```bash
# Database (External MySQL)
DATABASE_URL="mysql://username:password@your-mysql-host:3306/video_prisma"

# NextAuth.js
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# Stream.io Video API
STREAM_API_KEY="your-stream-api-key"
STREAM_SECRET="your-stream-secret"
STREAM_API_URL="https://api.stream-io-video.com"
NEXT_PUBLIC_STREAM_API_KEY="your-stream-api-key"

# Bunny CDN
BUNNY_ACCESS_KEY="your-bunny-access-key"
BUNNY_STORAGE_ZONE="your-storage-zone"
BUNNY_CDN_URL="https://cdn.bunny.net"
BUNNY_STORAGE_URL="https://storage.bunnycdn.com"

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Coolify Deployment Steps

### Option 1: Using Docker Compose (Recommended)

1. **Upload Files to Coolify:**
   - Upload your entire project directory
   - Make sure `Dockerfile`, `docker-compose.yml`, and `.dockerignore` are included

2. **Configure Environment Variables:**
   - In Coolify, go to your project settings
   - Add all the environment variables listed above
   - Set `NODE_ENV=production`

3. **Deploy:**
   - Coolify will automatically detect the `docker-compose.yml`
   - It will build and deploy your application

### Option 2: Using Dockerfile Only

1. **In Coolify Project Settings:**
   - Set **Build Pack** to `Docker`
   - Set **Dockerfile Path** to `Dockerfile`
   - Set **Port** to `3000`

2. **Environment Variables:**
   - Add all required environment variables
   - Make sure `DATABASE_URL` points to your external MySQL

3. **Deploy:**
   - Coolify will build from the Dockerfile
   - Application will be accessible on the configured port

## Build Process

The Dockerfile uses a multi-stage build:

1. **Dependencies Stage:** Installs npm packages
2. **Builder Stage:** Generates Prisma client and builds Next.js app
3. **Runner Stage:** Creates minimal production image with standalone output

### Cache Cleanup and App Router 404

- Clear Next.js cache before build to avoid stale artifacts:

  ```bash
  rm -rf .next
  ```

- Ensure no legacy `pages/404.tsx` or `pages/_document.(js|tsx)` are present. This project uses the App Router with `src/app/not-found.tsx`.

## Health Checks

The application includes a health check endpoint at `/api/health` that returns:
- Application status
- Timestamp
- Uptime

## Troubleshooting

### Common Issues

1. **Prisma Connection Errors:**
   - Verify `DATABASE_URL` is correct
   - Ensure MySQL server is accessible from Coolify
   - Check firewall rules

2. **Build Failures:**
   - Verify all dependencies are in `package.json`
   - Check Node.js version compatibility
   - Ensure `.dockerignore` isn't excluding necessary files

3. **Runtime Errors:**
   - Check environment variables are set correctly
   - Verify external services (Stream.io, Bunny CDN) are accessible
   - Check application logs in Coolify

### Logs

View application logs in Coolify:
- Go to your project
- Click on the running container
- View logs for debugging

## Performance Optimizations

- **Standalone Output:** Next.js builds as standalone for smaller Docker images
- **Multi-stage Build:** Reduces final image size
- **Alpine Linux:** Lightweight base image
- **Health Checks:** Automatic container health monitoring

## Security

- Non-root user (`nextjs`) runs the application
- Environment variables are properly isolated
- No sensitive data in Docker images

## Monitoring

The health check endpoint can be used by Coolify or external monitoring tools:
```bash
curl https://your-domain.com/api/health
```

## Updates

To update your application:
1. Push changes to your repository
2. Coolify will automatically rebuild and redeploy
3. No database migrations needed (external MySQL)

## Support

If you encounter issues:
1. Check Coolify logs
2. Verify environment variables
3. Test external service connectivity
4. Review Docker build logs
