# 🚀 DOCKERFILE PRODUCTION - OPTIMIZADO Y TESTEADO
# ===================================
# ✅ Testeado localmente con éxito
# ✅ Node 22 + Yarn 4.9.4
# ✅ Build standalone verificado
# ✅ Scripts mejorados adaptados de CitaPlanner
# ✅ start-improved.sh: logging detallado + error handling robusto
# ✅ emergency-start.sh: bypass DB checks para debug

FROM node:22-alpine AS base

RUN apk add --no-cache \
    bash \
    libc6-compat \
    openssl \
    curl \
    dumb-init

# Instalar yarn 4.9.4
RUN corepack enable && corepack prepare yarn@4.9.4 --activate

WORKDIR /app

# ===================================
# STAGE 1: Instalar dependencias
# ===================================
FROM base AS deps

WORKDIR /app

# Copy configuration files
COPY app/package.json ./
COPY app/yarn.lock ./
COPY app/.yarnrc.yml ./

# Instalar dependencias
RUN echo "📦 Instalando dependencias..." && \
    yarn install --frozen-lockfile --network-timeout 100000 && \
    echo "✅ $(ls node_modules | wc -l) paquetes instalados"

# ===================================
# STAGE 2: Build de producción
# ===================================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY app/ ./

# Build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_OUTPUT_MODE=standalone

# Limpiar y regenerar Prisma Client
RUN echo "🔧 Limpiando y generando Prisma Client..." && \
    rm -rf node_modules/.prisma node_modules/@prisma/client && \
    yarn prisma generate && \
    echo "✅ Prisma Client generado" && \
    echo "📋 Verificando tipos generados..." && \
    if [ -d "node_modules/.prisma/client" ]; then \
        echo "✅ Directorio node_modules/.prisma/client encontrado"; \
        ls -la node_modules/.prisma/client/ | head -10; \
    else \
        echo "❌ ERROR: Directorio node_modules/.prisma/client NO encontrado"; \
        echo "🔍 Buscando archivos de Prisma..."; \
        find node_modules -name "index.d.ts" -path "*/.prisma/*" 2>/dev/null | head -5; \
        exit 1; \
    fi && \
    echo ""

# Build Next.js application
RUN echo "🏗️  Building Next.js..." && \
    echo "Node version: $(node --version)" && \
    echo "Yarn version: $(yarn --version)" && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "Working directory: $(pwd)" && \
    echo "" && \
    yarn build && \
    echo "✅ Build completado"

# Verificar que standalone fue generado
RUN test -d ".next/standalone" || (echo "❌ Error: standalone no generado" && exit 1)

# Verificar estructura del standalone
RUN echo "📂 Verificando estructura del standalone..." && \
    ls -la .next/standalone/ && \
    echo "" && \
    ls -la .next/standalone/app/ && \
    test -f ".next/standalone/app/server.js" || (echo "❌ Error: server.js no encontrado en standalone/app/" && exit 1)

# ===================================
# STAGE 3: Runner de producción
# ===================================
FROM base AS runner

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create healthcheck.sh script directly in the image
RUN cat <<'EOF' > /app/healthcheck.sh
#!/bin/sh
# Healthcheck script for EscalaFin MVP
# Versión: 2.0 - Usa wget (incluido en alpine) en lugar de curl

PORT=${PORT:-3000}
HEALTH_URL="http://localhost:${PORT}/api/health"

echo "🏥 Ejecutando healthcheck en ${HEALTH_URL}..."

# Try to wget the health endpoint
if wget --no-verbose --tries=1 --spider "${HEALTH_URL}" > /dev/null 2>&1; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed"
  exit 1
fi
EOF

# Make healthcheck script executable
RUN chmod +x /app/healthcheck.sh

# Copy standalone build (con outputFileTracingRoot, standalone contiene carpeta app/)
COPY --from=builder /app/.next/standalone/app ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy startup scripts (adaptados de CitaPlanner)
COPY --chown=nextjs:nodejs start-improved.sh ./start-improved.sh
COPY --chown=nextjs:nodejs emergency-start.sh ./emergency-start.sh

# Make startup scripts executable
RUN chmod +x /app/start-improved.sh /app/emergency-start.sh

# Create directories
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh || exit 1

USER nextjs

EXPOSE 3000

# Use start-improved.sh for better logging and error handling
# To use emergency mode (bypass DB checks), change to: ./emergency-start.sh
CMD ["dumb-init", "sh", "/app/start-improved.sh"]
