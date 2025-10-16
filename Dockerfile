
# 🚀 ESCALAFIN MVP - DOCKERFILE OPTIMIZADO PARA PRODUCCIÓN
# Versión: 13.0 - Fix para npm install sin package-lock.json obligatorio
# Fecha: 2025-10-16
# Compatible con Coolify, GitHub Actions, Docker Hub, EasyPanel

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

# Configurar npm
ENV NPM_CONFIG_CACHE=/app/.npm-cache
ENV SKIP_ENV_VALIDATION=1

# Copy package files - soporta tanto npm como yarn
COPY app/package.json ./
COPY app/package-lock.json* ./
COPY app/yarn.lock* ./

# Instalar dependencias
# Usa package-lock.json si existe, sino genera uno nuevo
RUN echo "=== 📦 Instalando dependencias ===" && \
    if [ -f "package-lock.json" ]; then \
        echo "✓ Usando package-lock.json existente"; \
        npm ci --legacy-peer-deps --ignore-scripts; \
    else \
        echo "✓ Generando package-lock.json nuevo"; \
        npm install --legacy-peer-deps --ignore-scripts --no-optional; \
    fi && \
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

# Generar Prisma Client
RUN echo "=== 🔧 Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "✅ Prisma Client generado"

# Build de Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

RUN echo "=== 🏗️  Building Next.js ===" && \
    npm run build && \
    echo "✅ Build completado exitosamente"

# ===================================
# STAGE 3: runner - Imagen de producción
# ===================================
FROM base AS runner
WORKDIR /app

# Configurar entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necesarios de builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy scripts
COPY --from=builder /app/start.sh* /app/
COPY --from=builder /app/healthcheck.sh* /app/

# Hacer ejecutables los scripts
RUN if [ -f "start.sh" ]; then chmod +x start.sh; fi && \
    if [ -f "healthcheck.sh" ]; then chmod +x healthcheck.sh; fi

# Crear directorios necesarios
RUN mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app

# Configurar healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD if [ -f "healthcheck.sh" ]; then sh healthcheck.sh; else wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1; fi

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["dumb-init", "node", "server.js"]

# Labels de metadata
LABEL maintainer="EscalaFin Team"
LABEL version="13.0"
LABEL description="EscalaFin MVP - Sistema de Gestión de Préstamos y Créditos"
