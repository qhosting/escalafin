
# 🚀 ESCALAFIN MVP - DOCKERFILE OPTIMIZADO PARA PRODUCCIÓN
# Versión: 12.0 - Con mejores prácticas de CitaPlanner
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

# Configurar npm para usar cache
ENV NPM_CONFIG_CACHE=/app/.npm-cache

# Copy package files
COPY app/package.json app/package-lock.json* ./

# Instalar dependencias con npm
RUN echo "=== 📦 Instalando dependencias con NPM ===" && \
    npm cache clean --force && \
    npm ci --legacy-peer-deps --ignore-scripts && \
    echo "✅ Dependencias instaladas correctamente"

# ===================================
# STAGE 2: builder - Build de la aplicación
# ===================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY app/ .

# Variables de entorno para el build
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client
RUN echo "=== 🔧 Generando Prisma Client ===" && \
    npx prisma generate && \
    echo "✅ Prisma Client generado"

# Build Next.js application con standalone output
RUN echo "=== 🏗️ Building Next.js con standalone output ===" && \
    npm run build && \
    echo "✅ Build completado"

# Verificar que standalone fue creado correctamente
RUN echo "=== 🔍 Verificando standalone build ===" && \
    if [ ! -d ".next/standalone" ]; then \
        echo "❌ ERROR: .next/standalone no fue creado" && \
        echo "📂 Contenido de .next/:" && \
        ls -la .next/ && \
        exit 1; \
    fi && \
    echo "✅ Standalone build verificado"

# ===================================
# STAGE 3: public-files - Copiar archivos públicos
# ===================================
FROM base AS public-files
WORKDIR /app
COPY app/public ./public

# ===================================
# STAGE 4: runner - Imagen de producción
# ===================================
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy el build standalone con permisos correctos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/app ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/.next/static ./.next/static

# Copy archivos públicos desde stage dedicado
COPY --from=public-files --chown=nextjs:nodejs /app/public ./public

# Copy archivos de Prisma con permisos correctos
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma binaries necesarios
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy scripts folder para seed execution
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy essential node_modules para seed execution (bcryptjs, tsx, y ALL tsx dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/typescript ./node_modules/typescript

# Copy tsx transitive dependencies (required for tsx to work)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps

# Copy scripts de inicio
COPY --chown=nextjs:nodejs start.sh ./
RUN chmod +x start.sh

# Crear directorios con permisos correctos
RUN mkdir -p node_modules/.prisma node_modules/@prisma node_modules/.bin \
    && mkdir -p /app/uploads \
    && chown -R nextjs:nodejs node_modules/.prisma node_modules/@prisma node_modules/.bin /app/uploads

# Verificar instalación de Prisma
RUN echo "=== 🔍 Verificando instalación de Prisma ===" && \
    ls -la node_modules/.bin/prisma && echo "✅ Prisma CLI encontrado" || echo "⚠️ Prisma CLI no encontrado"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check usando el nuevo endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Iniciar aplicación con script robusto
CMD ["./start.sh"]
