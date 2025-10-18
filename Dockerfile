
# 🚀 DOCKERFILE STEP 3: BUILD COMPLETO CON YARN
# Fix: Usar Node 22 + Yarn 4.9.4 (mismas versiones que local)
# ===================================

FROM node:22-alpine AS base

RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    dumb-init

# Instalar yarn 4.9.4 exactamente (misma versión que local)
RUN corepack enable && corepack prepare yarn@4.9.4 --activate

WORKDIR /app

# ===================================
# STAGE 1: Instalar dependencias
# ===================================
FROM base AS deps

WORKDIR /app

# Copy package files (SOLO yarn.lock, ignorar package-lock.json)
COPY app/package.json app/yarn.lock* ./

# Instalar dependencias con yarn (más estable que npm)
RUN echo "=== 📦 Instalando dependencias con Yarn ===" && \
    echo "📊 Versión de yarn: $(yarn --version)" && \
    echo "📊 Versión de node: $(node --version)" && \
    yarn install --frozen-lockfile --network-timeout 100000 && \
    echo "✅ Dependencias instaladas correctamente"

# ===================================
# STAGE 2: Build completo
# ===================================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY app/ ./

# Configurar env vars
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_OUTPUT_MODE=standalone

# Generar Prisma
RUN echo "=== 🔧 Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "✅ Prisma Client generado"

# Build Next.js
RUN echo "=== 🏗️  Building Next.js ===" && \
    yarn build && \
    echo "✅ Build completado"

# Verificar standalone
RUN if [ ! -d ".next/standalone" ]; then \
        echo "❌ ERROR: Standalone NO generado"; \
        exit 1; \
    fi && \
    echo "✅ Standalone verificado"

# ===================================
# STAGE 3: Runner de producción
# ===================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy scripts
COPY start.sh healthcheck.sh /app/
RUN chmod +x /app/start.sh /app/healthcheck.sh

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Crear directorios
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app

# Verificar server.js
RUN if [ ! -f "/app/server.js" ]; then \
        echo "❌ ERROR: server.js no encontrado"; \
        exit 1; \
    fi

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh || exit 1

USER nextjs

EXPOSE 3000

CMD ["dumb-init", "sh", "/app/start.sh"]
