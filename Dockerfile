
# ESCALAFIN MVP - DOCKERFILE OPTIMIZADO PARA EASYPANEL
# Versión: 9.4 - Fix standalone output forzado
# Fecha: 2025-10-15

FROM node:18-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    libc6-compat \
    curl \
    openssl \
    && rm -rf /var/cache/apk/*

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ===== STAGE 1: Instalar TODAS las dependencias =====
FROM base AS deps

# Copiar archivos de dependencias
COPY app/package.json ./

# Verificar e instalar dependencias con manejo de errores
RUN echo "=== Instalando dependencias ===" && \
    npm install --legacy-peer-deps --loglevel=verbose 2>&1 | tail -100 && \
    echo "✅ Dependencias instaladas correctamente"

# ===== STAGE 2: Build de la aplicación =====
FROM base AS builder

WORKDIR /app

# Copiar node_modules del stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todos los archivos del código fuente
COPY app/ ./

# Configurar variables de entorno para el build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_OUTPUT_MODE=standalone

# Variables placeholder para el build
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="placeholder-secret-min-32-chars-long-for-nextauth"

# Variables adicionales que pueden ser necesarias
ENV AWS_BUCKET_NAME="placeholder-bucket"
ENV AWS_FOLDER_PREFIX="placeholder/"
ENV AWS_REGION="us-east-1"
ENV OPENPAY_MERCHANT_ID="placeholder"
ENV OPENPAY_PRIVATE_KEY="placeholder"
ENV OPENPAY_PUBLIC_KEY="placeholder"
ENV OPENPAY_BASE_URL="https://sandbox-api.openpay.mx/v1"
ENV EVOLUTION_API_URL="http://localhost:8080"
ENV EVOLUTION_API_TOKEN="placeholder"
ENV EVOLUTION_INSTANCE_NAME="placeholder"

# Generar Prisma Client
RUN echo "=== Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "✅ Prisma Client generado"

# Forzar configuración standalone en next.config.js
RUN echo "=== Configurando standalone output ===" && \
    sed -i "s/output: process.env.NEXT_OUTPUT_MODE,/output: 'standalone',/" next.config.js && \
    echo "Configuración aplicada:" && \
    grep "output:" next.config.js

# Build de Next.js con logs detallados
RUN echo "=== Iniciando build de Next.js ===" && \
    npm run build 2>&1 | tee /tmp/build.log || (cat /tmp/build.log && exit 1)

# Verificar standalone output
RUN echo "=== Verificando build standalone ===" && \
    ls -la .next/ && \
    if [ ! -d ".next/standalone" ]; then \
        echo "❌ ERROR: standalone output no generado"; \
        echo "=== Contenido de .next: ===" ; \
        find .next -type d -maxdepth 2 ; \
        exit 1; \
    fi && \
    echo "✅ Standalone output verificado"

# ===== STAGE 3: Production image =====
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar Prisma para migraciones
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
