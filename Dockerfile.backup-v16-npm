

# 🚀 ESCALAFIN MVP - DOCKERFILE OPTIMIZADO PARA PRODUCCIÓN
# Versión: 16.0 - Fix npm ci -> npm install (lockfileVersion 3 compatible)
# Fecha: 2025-10-16
# Compatible con Coolify, GitHub Actions, Docker Hub, EasyPanel
#
# CAMBIOS EN v16.0:
# - ✅ Cambiado npm ci por npm install para evitar problemas con lockfileVersion 3
# - ✅ Agregado logging de versiones de npm y node para debugging
# - ✅ Agregado detección automática de lockfileVersion
# - ✅ Uso de --prefer-offline para builds más rápidos
# - ✅ Más robusto y compatible con diferentes versiones de package-lock.json

# ===================================
# STAGE 0: Base - Imagen base
# ===================================
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    wget \
    dumb-init \
    openssl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# ===================================
# STAGE 1: deps - Instalar dependencias
# ===================================
FROM base AS deps
WORKDIR /app

# Actualizar npm a versión específica que soporte lockfileVersion 3
RUN echo "=== 📦 Instalando npm v10.9.0 ===" && \
    npm install -g npm@10.9.0 && \
    npm --version && \
    echo "✅ npm 10.9.0 instalado (soporta lockfileVersion 3)"

# Configurar npm
ENV NPM_CONFIG_CACHE=/app/.npm-cache
ENV SKIP_ENV_VALIDATION=1

# Copy package files (optimizado para cache)
COPY app/package.json ./
COPY app/package-lock.json* ./
COPY app/yarn.lock* ./

# Instalar dependencias - Usar npm install en lugar de npm ci para evitar problemas con lockfileVersion
RUN echo "=== 📦 Instalando dependencias ===" && \
    echo "📊 Versión de npm: $(npm --version)" && \
    echo "📊 Versión de node: $(node --version)" && \
    if [ -f "package-lock.json" ]; then \
        echo "✓ package-lock.json encontrado (lockfileVersion: $(grep -o '"lockfileVersion": [0-9]*' package-lock.json | grep -o '[0-9]*'))"; \
    fi && \
    echo "🔧 Usando npm install (más robusto que npm ci)" && \
    npm install --legacy-peer-deps --ignore-scripts --no-optional --prefer-offline && \
    echo "✅ Dependencias instaladas correctamente"

# ===================================
# STAGE 2: builder - Build de la aplicación
# ===================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY app/ ./

# Configurar variables de entorno para el build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_OUTPUT_MODE=standalone

# Generar Prisma Client
RUN echo "=== 🔧 Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "✅ Prisma Client generado"

# Build de Next.js en modo standalone
RUN echo "=== 🏗️  Building Next.js (standalone mode) ===" && \
    npm run build && \
    echo "✅ Build completado exitosamente" && \
    echo "🔍 Verificando archivos generados..." && \
    ls -la .next/ && \
    if [ -d ".next/standalone" ]; then \
        echo "✅ Standalone build generado correctamente"; \
        ls -la .next/standalone/ | head -10; \
    else \
        echo "❌ ERROR: Standalone build NO generado"; \
        exit 1; \
    fi

# ===================================
# STAGE 3: runner - Imagen de producción
# ===================================
FROM base AS runner
WORKDIR /app

# Configurar entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ===================================
# Copiar archivos de producción
# ===================================

# 1. Copiar scripts de infraestructura (desde root del proyecto)
COPY start.sh healthcheck.sh /app/
RUN chmod +x /app/start.sh /app/healthcheck.sh && \
    echo "✅ Scripts de infraestructura copiados"

# 2. Copiar standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 3. Copiar archivos públicos
COPY --from=builder /app/public ./public

# 4. Copiar Prisma client y schema
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 5. Crear directorios necesarios
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app && \
    echo "✅ Directorios creados y permisos configurados"

# Verificar que server.js existe
RUN if [ ! -f "/app/server.js" ]; then \
        echo "❌ ERROR CRÍTICO: server.js no encontrado"; \
        echo "📂 Contenido de /app:"; \
        ls -la /app/; \
        exit 1; \
    fi && \
    echo "✅ server.js verificado en /app/server.js"

# Configurar healthcheck mejorado
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /app/healthcheck.sh || wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Comando de inicio
# Nota: start.sh contiene lógica de migraciones y seed
CMD ["dumb-init", "sh", "/app/start.sh"]

# Labels de metadata
LABEL maintainer="EscalaFin Team"
LABEL version="15.0"
LABEL description="EscalaFin MVP - Sistema de Gestión de Préstamos y Créditos"
LABEL changelog="v15.0: Fix completo - standalone mode + scripts corregidos"

