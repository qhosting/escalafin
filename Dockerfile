
# Simplified single-stage Dockerfile for EasyPanel
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Set environment variables early
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files first for better caching
COPY app/package.json app/package-lock.json* app/yarn.lock* ./

# Install dependencies - try multiple approaches for stability
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    elif [ -f yarn.lock ]; then \
      yarn install --network-timeout 300000; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Copy all application files
COPY app/ .

# Generate Prisma client with error handling
RUN npx prisma generate || echo "Prisma generation failed - continuing"

# Build Next.js application with timeout handling
RUN timeout 600 npm run build || (echo "Build timeout - retrying..." && npm run build)

# Set correct ownership for all files
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check with longer startup time
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
