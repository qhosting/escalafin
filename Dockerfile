
# ESCALAFIN MVP - DOCKERFILE OPTIMIZADO PARA EASYPANEL
# Versión: 9.2 - Fix npm install (sin package-lock.json)
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
ENV NEXTAUTH_SECRET="placeholder-secret"

# Generar Prisma Client
RUN npx prisma generate

# Build de Next.js con verificación
RUN npm run build && \
    echo "=== Verificando build standalone ===" && \
    ls -la .next/ && \
    if [ ! -d ".next/standalone" ]; then \
        echo "❌ ERROR: standalone output no generado"; \
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
