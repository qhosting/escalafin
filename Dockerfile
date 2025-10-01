# ESCALAFIN MVP - DOCKERFILE v8.0 OPTIMIZADO
# Build optimizado para EasyPanel/Coolify
FROM node:18-alpine AS base

# Labels
LABEL maintainer="escalafin-build@2025-10-01"  
LABEL version="8.0-optimized"
LABEL build-date="2025-10-01T04:40:00Z"

# Instalar dependencias del sistema
RUN apk add --no-cache \
    libc6-compat \
    curl \
    git \
    openssl \
    && rm -rf /var/cache/apk/*

# Habilitar Corepack para Yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# Variables de entorno básicas
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# ===== STAGE: Dependencies =====
FROM base AS deps

# Copiar archivos de dependencias
COPY app/package.json app/yarn.lock* app/package-lock.json* ./

# Instalar dependencias
RUN echo "=== INSTALANDO DEPENDENCIAS ===" && \
    echo "Node: $(node --version)" && \
    echo "Yarn: $(yarn --version)" && \
    if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile --network-timeout 600000; \
    elif [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# ===== STAGE: Builder =====
FROM base AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY app/ .

# Args para build-time (no quedan en la imagen final)
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG NEXTAUTH_SECRET="build-time-secret-placeholder"
ARG AWS_BUCKET_NAME="placeholder-bucket"
ARG AWS_FOLDER_PREFIX="placeholder/"
ARG OPENPAY_MERCHANT_ID="placeholder"
ARG OPENPAY_PRIVATE_KEY="placeholder"
ARG OPENPAY_PUBLIC_KEY="placeholder"
ARG OPENPAY_BASE_URL="https://sandbox-api.openpay.mx/v1"
ARG EVOLUTION_API_URL="https://placeholder.com"
ARG EVOLUTION_API_TOKEN="placeholder"
ARG EVOLUTION_INSTANCE_NAME="placeholder"

# Variables para el build
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generar cliente Prisma
RUN echo "=== GENERANDO CLIENTE PRISMA ===" && \
    if [ -f prisma/schema.prisma ]; then \
      echo "Schema encontrado, generando cliente..." && \
      npx prisma generate && \
      echo "✅ Cliente Prisma generado"; \
    else \
      echo "❌ No se encontró prisma/schema.prisma" && exit 1; \
    fi

# Build de Next.js
RUN echo "=== BUILD NEXT.JS ===" && \
    npm run build && \
    echo "✅ Build completado"

# ===== STAGE: Runner (imagen final) =====
FROM base AS runner

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# Copiar archivos necesarios para producción
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Copiar start script si existe
COPY --from=builder --chown=nextjs:nodejs /app/start.sh* ./

# Variables de entorno para runtime (serán sobrescritas por el host)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["npm", "start"]
