# 🚀 DOCKERFILE PRODUCTION - OPTIMIZADO Y TESTEADO
# ===================================
# ✅ Testeado localmente con éxito
# ✅ Node 22 + Yarn 4.9.4
# ✅ Build standalone verificado

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

# Copy startup scripts to make them available for the runner stage
COPY start.sh healthcheck.sh ./

# Build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_OUTPUT_MODE=standalone

# Generar Prisma Client
RUN echo "🔧 Generando Prisma Client..." && \
    npx prisma generate

# Switch to bash for the build command to use PIPESTATUS
SHELL ["/bin/bash", "-c"]

# Build Next.js application
RUN echo "🏗️  Building Next.js..." && \
    yarn build 2>&1 | tee /tmp/build.log; \
    BUILD_EXIT_CODE=${PIPESTATUS[0]}; \
    if [ $BUILD_EXIT_CODE -ne 0 ]; then \
        echo "❌ Build falló con código $BUILD_EXIT_CODE"; \
        echo ""; \
        echo "=== ÚLTIMAS 100 LÍNEAS DEL BUILD LOG ==="; \
        tail -100 /tmp/build.log; \
        echo ""; \
        echo "=== INFORMACIÓN DE DEPURACIÓN ==="; \
        echo "Node version: $(node --version)"; \
        echo "Yarn version: $(yarn --version)"; \
        echo "NODE_ENV: $NODE_ENV"; \
        echo "SKIP_ENV_VALIDATION: $SKIP_ENV_VALIDATION"; \
        echo "NEXT_OUTPUT_MODE: $NEXT_OUTPUT_MODE"; \
        echo ""; \
        echo "=== ARCHIVOS CRÍTICOS ==="; \
        ls -la | head -20; \
        echo ""; \
        echo "=== tsconfig.json ==="; \
        cat tsconfig.json | head -30; \
        exit 1; \
    fi && \
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

# Copy startup scripts
COPY --from=builder /app/start.sh /app/healthcheck.sh /app/
RUN chmod +x /app/start.sh /app/healthcheck.sh

# Copy standalone build (con outputFileTracingRoot, standalone contiene carpeta app/)
COPY --from=builder /app/.next/standalone/app ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create directories
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh || exit 1

USER nextjs

EXPOSE 3000

CMD ["dumb-init", "sh", "/app/start.sh"]
