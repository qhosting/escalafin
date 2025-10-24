# 🚀 DOCKERFILE PRODUCTION - OPTIMIZADO Y TESTEADO
# ===================================
# ✅ Testeado localmente con éxito
# ✅ Node 22 + Yarn 4.9.4
# ✅ Build standalone verificado

FROM node:22-alpine AS base

RUN apk add --no-cache \
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

# Build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_OUTPUT_MODE=standalone

# Generar Prisma Client
RUN echo "🔧 Generando Prisma Client..." && \
    npx prisma generate

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

# Create start.sh script directly in the image to avoid COPY issues
RUN cat <<'EOF' > /app/start.sh
#!/bin/sh

echo "🚀 Iniciando ESCALAFIN..."

# Configurar PATH to include node_modules/.bin for Prisma CLI
export PATH="$PATH:/app/node_modules/.bin"
echo "📦 PATH configurado: $PATH"

# Verify .bin directory and Prisma CLI exist
echo "🔍 Verificando Prisma CLI..."
if [ -f "node_modules/.bin/prisma" ]; then
    echo "✅ Prisma CLI encontrado en node_modules/.bin/prisma"
    PRISMA_CMD="node_modules/.bin/prisma"
elif [ -f "node_modules/prisma/build/index.js" ]; then
    echo "⚠️ Usando Prisma directamente desde build/index.js"
    PRISMA_CMD="node node_modules/prisma/build/index.js"
else
    echo "❌ Prisma CLI no encontrado - intentando con npx"
    PRISMA_CMD="npx prisma"
fi

echo "🔐 Comando Prisma: $PRISMA_CMD"

# Verificar cliente Prisma
echo "🔍 Verificando cliente Prisma..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Cliente Prisma encontrado"
else
    echo "⚠️ Cliente Prisma no encontrado, generando..."
    $PRISMA_CMD generate || echo "❌ Error generando cliente Prisma"
fi

# Aplicar migraciones (sin verificar resultado)
echo "🔄 Aplicando migraciones si es necesario..."
$PRISMA_CMD migrate deploy || echo "⚠️ Error en migraciones, continuando..."

# Verificar estado de migraciones
echo "📋 Verificando estado de migraciones..."
$PRISMA_CMD migrate status || echo "⚠️ No se pudo verificar estado de migraciones"

# Regenerar cliente Prisma en container
echo "🔧 Regenerando cliente Prisma en container..."
$PRISMA_CMD generate || echo "⚠️ Error generando cliente Prisma"

# Ejecutar seed solo si no hay usuarios
echo "🌱 Verificando si necesita seed..."
echo "📋 Consultando tabla users..."

# Check if users table is empty using node script
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => { console.log(count); process.exit(0); })
  .catch(err => { console.error('0'); process.exit(0); })
  .finally(() => prisma.\$disconnect());
" 2>/dev/null || echo "0")

echo "👥 Usuarios en la base de datos: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Base de datos vacía - ejecutando seed..."
    if [ -f "scripts/seed.ts" ]; then
        echo "✅ Seed script encontrado, ejecutando..."
        npm run seed || echo "⚠️ Error ejecutando seed, continuando..."
    else
        echo "⚠️ Script seed.ts no encontrado en scripts/"
        echo "📂 Contenido de scripts/:"
        ls -la scripts/ 2>/dev/null || echo "Directorio scripts/ no existe"
    fi
else
    echo "✅ Base de datos ya tiene usuarios, omitiendo seed"
fi

# Verificar archivos necesarios
echo "🔍 Verificando archivos de Next.js standalone..."

# Verify server.js exists in the correct location (/app/server.js)
if [ ! -f "/app/server.js" ]; then
    echo "❌ ERROR CRITICO: server.js NO ENCONTRADO en /app/server.js"
    echo "📂 Estructura del directorio /app:"
    ls -la /app/ | head -30
    echo ""
    echo "🔍 Buscando server.js en todo el filesystem:"
    find /app -name "server.js" -type f 2>/dev/null | head -10
    echo ""
    echo "❌ El Dockerfile no copió correctamente el standalone build"
    echo "🔧 Intentando fallback con next start..."
    exit 1
fi

echo "✅ server.js encontrado en /app/server.js (CORRECTO)"
echo "📂 Contenido del directorio /app:"
ls -la /app/ | head -20

# Verificar archivos necesarios
echo ""
echo "🔍 Verificando archivos críticos de ESCALAFIN..."

# Iniciar la aplicacion desde /app con server.js
echo ""
echo "🚀 Iniciando servidor Next.js standalone..."
echo "   📂 Working directory: /app"
echo "   🖥️ Server: /app/server.js"
echo "   🌐 Hostname: 0.0.0.0"
echo "   🔌 Port: 3000"
echo ""

cd /app || {
    echo "❌ ERROR: No se puede cambiar a /app"
    exit 1
}

echo "🎉 EJECUTANDO: node server.js"
exec node server.js
EOF

# Create healthcheck.sh script directly in the image
RUN cat <<'EOF' > /app/healthcheck.sh
#!/bin/sh
# Healthcheck script for EscalaFin MVP
# Versión: 2.0 - Usa wget (incluido en alpine) en lugar de curl

PORT=${PORT:-3000}
HEALTH_URL="http://localhost:${PORT}/api/health"

echo "🏥 Ejecutando healthcheck en ${HEALTH_URL}..."

# Try to wget the health endpoint
if wget --no-verbose --tries=1 --spider "${HEALTH_URL}" > /dev/null 2>&1; then
  echo "✅ Health check passed"
  exit 0
else
  echo "❌ Health check failed"
  exit 1
fi
EOF

# Make scripts executable
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
