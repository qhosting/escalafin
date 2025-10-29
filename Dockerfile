# 🚀 DOCKERFILE PRODUCTION - OPTIMIZADO Y TESTEADO
# ===================================
# ✅ Testeado localmente con éxito
# ✅ Node 18-slim (Debian-based, glibc para compatibilidad Next.js SWC)
# ✅ NPM (gestor de paquetes estable y predecible)
# ✅ Build standalone verificado
# ✅ Scripts mejorados adaptados de CitaPlanner
# ✅ start-improved.sh: logging detallado + error handling robusto
# ✅ emergency-start.sh: bypass DB checks para debug
# ✅ Fixed: Migrado a NPM para evitar problemas de workspace de Yarn Berry
# ✅ Fixed: Cambio a node:18-slim para resolver error SWC con Alpine/musl

FROM node:18-slim AS base

RUN apt-get update && apt-get install -y \
    bash \
    openssl \
    curl \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ===================================
# STAGE 1: Instalar dependencias
# ===================================
FROM base AS deps

WORKDIR /app

# Copy configuration files
COPY app/package.json ./
COPY app/package-lock.json ./

# Instalar dependencias
RUN echo "📦 Instalando dependencias con NPM..." && \
    npm ci --legacy-peer-deps && \
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

# Crear yarn.lock dummy para Next.js outputFileTracingRoot
# Next.js busca lockfiles en el directorio padre debido a outputFileTracingRoot
RUN echo "# Dummy lockfile for Next.js outputFileTracingRoot" > /app/yarn.lock && \
    echo "✅ yarn.lock dummy creado en /app"

# Generar Prisma Client
RUN echo "🔧 Generando Prisma Client..." && \
    npx prisma generate && \
    echo "✅ Prisma Client generado correctamente"

# Build Next.js application
RUN echo "🏗️  Building Next.js..." && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "Working directory: $(pwd)" && \
    echo "" && \
    npm run build && \
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
#!/bin/bash
# Healthcheck script for EscalaFin MVP
# Versión: 3.0 - Usa curl (incluido en node:18-slim base)

PORT=${PORT:-3000}
HEALTH_URL="http://localhost:${PORT}/api/health"

echo "🏥 Ejecutando healthcheck en ${HEALTH_URL}..."

# Try to curl the health endpoint
if curl -f -s "${HEALTH_URL}" > /dev/null 2>&1; then
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

# Copy Prisma for migrations and database sync
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copy ENTIRE .bin directory to include all Prisma WASM files
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy bcryptjs and its dependencies for setup scripts
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy scripts directory (includes setup-users-production.js and other utilities)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Ensure bcryptjs is accessible by creating a simple wrapper to verify
RUN echo "✅ Verificando módulos de runtime necesarios..." && \
    test -d "./node_modules/bcryptjs" && echo "   ✓ bcryptjs disponible" || echo "   ✗ bcryptjs NO disponible"

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
