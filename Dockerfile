
# ESCALAFIN MVP - DOCKERFILE v3.0 CORREGIDO - RUTA FIJA
# Fix for EasyPanel "app/ not found" error
FROM node:18-alpine

# Custom labels for cache busting  
LABEL maintainer="escalafin-easypanel@2025-09-23"
LABEL version="3.0-path-fixed"
LABEL build-date="2025-09-23T05:55:00Z"

# Install system packages
RUN apk add --no-cache \
    libc6-compat \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /escalafin-app

# Environment variables
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1" 
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

# Create user and group
RUN addgroup -g 1001 -S escalafin-group && \
    adduser -u 1001 -S escalafin-user -G escalafin-group

# FIXED: Copy package files correctly from app subdirectory
COPY app/package.json app/package-lock.json* app/yarn.lock* ./

# Install dependencies with error handling
RUN if [ -f yarn.lock ]; then \
      yarn install --network-timeout 300000 --production; \
    elif [ -f package-lock.json ]; then \
      npm ci --only=production --legacy-peer-deps; \
    else \
      npm install --only=production --legacy-peer-deps; \
    fi

# FIXED: Copy all application files from app subdirectory
COPY app/ ./

# Generate Prisma client if schema exists
RUN if [ -f prisma/schema.prisma ]; then \
      npx prisma generate; \
    else \
      echo "No Prisma schema found, skipping generation"; \
    fi

# Build Next.js application with extended timeout
RUN timeout 900 npm run build || \
    (echo "Build failed, checking logs..." && \
     ls -la && \
     cat package.json && \
     exit 1)

# Set proper ownership
RUN chown -R escalafin-user:escalafin-group /escalafin-app

# Switch to non-root user  
USER escalafin-user

# Expose port
EXPOSE 3000

# Health check with extended start period
HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
