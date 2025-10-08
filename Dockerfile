# ESCALAFIN MVP - DOCKERFILE v8.7 OPTIMIZADO
# Build optimizado para EasyPanel/Coolify usando NPM + Standalone
FROM node:18-alpine AS base

# Labels
LABEL maintainer="escalafin-build@2025-10-06"  
LABEL version="8.7-standalone-fixed"
LABEL build-date="2025-10-06T19:10:00Z"

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
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generar cliente Prisma (simplificado)
RUN echo "=== GENERANDO CLIENTE PRISMA ===" && \
    cd /app && \
    npx --yes prisma@6.7.0 generate --schema=./prisma/schema.prisma || \
    (echo "❌ Error generando Prisma client" && \
     echo "Schema location:" && ls -la prisma/ && \
     echo "Prisma version:" && npx prisma --version && \
     exit 1)

# Build de Next.js con logs detallados
RUN echo "=== BUILD NEXT.JS ===" && \
    npm run build && \
    echo "=== VERIFICANDO BUILD ===" && \
    ls -la .next/ && \
    test -f .next/BUILD_ID && \
    echo "✅ Build completado exitosamente" || \
    (echo "❌ BUILD FALLÓ O .next NO EXISTE" && \
     echo "=== CONTENIDO DEL DIRECTORIO ===" && \
     ls -laR && \
     exit 1)

# ===== STAGE: Runner (imagen final) =====
FROM base AS runner

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# Copiar archivos del standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

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

# Comando de inicio usando standalone server
CMD ["node", "server.js"]
