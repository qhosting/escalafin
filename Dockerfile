# ESCALAFIN MVP - DOCKERFILE v8.2 OPTIMIZADO
# Build optimizado para EasyPanel/Coolify usando NPM
FROM node:18-alpine AS base

# Labels
LABEL maintainer="escalafin-build@2025-10-01"  
LABEL version="8.2-explicit-copy"
LABEL build-date="2025-10-01T05:00:00Z"

# Instalar dependencias del sistema
RUN apk add --no-cache \
    libc6-compat \
    curl \
    wget \
    git \
    openssl \
    && rm -rf /var/cache/apk/*

# Variables de entorno básicas
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# ===== STAGE: Dependencies =====
FROM base AS deps

# Copiar archivos de dependencias
COPY app/package.json ./

# Instalar dependencias usando npm
RUN echo "=== INSTALANDO DEPENDENCIAS ===" && \
    echo "Node: $(node --version)" && \
    echo "NPM: $(npm --version)" && \
    npm install --legacy-peer-deps --loglevel verbose

# ===== STAGE: Builder =====
FROM base AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente completo
COPY app/package.json ./package.json
COPY app/next.config.js ./next.config.js
COPY app/tsconfig.json ./tsconfig.json
COPY app/tailwind.config.ts ./tailwind.config.ts
COPY app/postcss.config.js ./postcss.config.js
COPY app/components.json ./components.json
COPY app/prisma ./prisma
COPY app/app ./app
COPY app/components ./components
COPY app/lib ./lib
COPY app/hooks ./hooks
COPY app/public ./public

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

# Listar contenido para debug
RUN echo "=== CONTENIDO DEL DIRECTORIO ===" && \
    ls -la && \
    echo "=== PRISMA SCHEMA ===" && \
    ls -la prisma/

# Generar cliente Prisma
RUN echo "=== GENERANDO CLIENTE PRISMA ===" && \
    npx prisma generate && \
    echo "✅ Cliente Prisma generado"

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
