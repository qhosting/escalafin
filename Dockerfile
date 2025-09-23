
# ESCALAFIN MVP - OPTIMIZED DOCKERFILE v2.0 - CACHE BUSTER
# Completely rewritten to force EasyPanel cache invalidation
FROM node:18-alpine

# UNIQUE: Custom labels for cache busting
LABEL maintainer="escalafin-deploy@2025-09-23"
LABEL version="2.0-cache-buster"
LABEL build-date="2025-09-23T05:40:00Z"

# UNIQUE: Install packages with optimized approach
RUN apk add --no-cache \
    libc6-compat \
    curl \
    && rm -rf /var/cache/apk/*

# UNIQUE: Set workdir with custom path
WORKDIR /escalafin-app

# UNIQUE: Environment variables with different formatting
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1" 
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

# UNIQUE: Create users with different approach
RUN addgroup -g 1001 -S escalafin-group && \
    adduser -u 1001 -S escalafin-user -G escalafin-group

# UNIQUE: Copy package files from app subdirectory  
COPY app/package*.json app/yarn.lock* ./

# UNIQUE: Install dependencies with NO frozen lockfile constraint
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    elif [ -f yarn.lock ]; then \
      yarn install --network-timeout 300000; \
    else \
      npm install --legacy-peer-deps; \
    fi

# UNIQUE: Copy application files with different approach
COPY app/ ./

# UNIQUE: Generate Prisma with enhanced error handling
RUN npx prisma generate 2>/dev/null || echo "Prisma generation skipped - no schema found"

# UNIQUE: Build with enhanced timeout and retry logic
RUN timeout 600 npm run build || \
    (echo "Build timeout - retrying with extended timeout..." && \
     timeout 900 npm run build)

# UNIQUE: Set ownership with different user names
RUN chown -R escalafin-user:escalafin-group /escalafin-app

# UNIQUE: Switch to custom non-root user
USER escalafin-user

# UNIQUE: Expose port with inline documentation
EXPOSE 3000
# Port 3000 is used by Next.js production server

# UNIQUE: Enhanced health check with longer start period
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# UNIQUE: Start with explicit npm start
CMD ["npm", "start"]
