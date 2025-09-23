
# ESCALAFIN MVP - DOCKERFILE v6.4 VERBOSE DEBUG
# COPIA DIRECTA + Debug completo para identificar error exacto
FROM node:18-alpine

# Labels únicos para invalidar cache
LABEL maintainer="escalafin-build@2025-09-23"
LABEL version="6.4-verbose-debug"
LABEL build-date="2025-09-23T16:20:00Z"

# Instalar dependencias del sistema
RUN apk add --no-cache \
    libc6-compat \
    curl \
    git \
    && rm -rf /var/cache/apk/*

# Instalar yarn de forma robusta
RUN npm install -g yarn@1.22.19 --registry https://registry.npmjs.org/ || \
    (echo "Fallback: instalando yarn con npm cache clean" && \
     npm cache clean --force && \
     npm install -g yarn@1.22.19 --registry https://registry.npmjs.org/) || \
    (echo "Fallback final: usando npm en lugar de yarn" && \
     echo "yarn_fallback=true" > /tmp/use_npm)

# Directorio de trabajo  
WORKDIR /app

# Variables de entorno
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Crear usuario del sistema
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# SOLUCIÓN DIRECTA: Copiar específicamente el directorio app/
COPY app/ /app/

# VALIDACIÓN CRÍTICA: Verificar package.json
RUN echo "=== DOCKERFILE v6.0 - VALIDACIÓN ===" && \
    echo "Archivos copiados a /app/:" && \
    ls -la /app/ && \
    echo "" && \
    if [ -f "/app/package.json" ]; then \
      echo "✅ package.json encontrado correctamente" && \
      echo "Contenido (primeras 10 líneas):" && \
      head -10 /app/package.json; \
    else \
      echo "❌ CRÍTICO: package.json no encontrado" && \
      echo "Estructura completa:" && \
      find /app -type f -name "*.json" | head -5 && \
      exit 1; \
    fi

# Instalar TODAS las dependencias (incluyendo dev para build)
RUN echo "=== INSTALACIÓN DE DEPENDENCIAS ===" && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    if [ -f yarn.lock ] && [ -x "$(command -v yarn)" ]; then \
      echo "=== USANDO YARN (FULL INSTALL) ===" && \
      yarn --version && \
      yarn install --network-timeout 600000 --ignore-engines; \
    else \
      echo "=== USANDO NPM (FULL INSTALL) ===" && \
      npm install --legacy-peer-deps --maxsockets 1; \
    fi

# Generar cliente Prisma si existe
RUN if [ -f prisma/schema.prisma ]; then \
      echo "=== GENERANDO CLIENTE PRISMA ===" && \
      npx prisma generate; \
    else \
      echo "=== NO HAY SCHEMA PRISMA ===" && \
      ls -la prisma/ 2>/dev/null || echo "No hay directorio prisma/"; \
    fi

# Variables de entorno necesarias para el build
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret"
ENV AWS_BUCKET_NAME="placeholder-bucket"
ENV AWS_FOLDER_PREFIX="placeholder/"
ENV OPENPAY_API_KEY="placeholder"
ENV OPENPAY_MERCHANT_ID="placeholder"
ENV OPENPAY_BASE_URL="https://sandbox-api.openpay.mx"
ENV WHATSAPP_INSTANCE_ID="placeholder"
ENV WHATSAPP_ACCESS_TOKEN="placeholder"

# Verificar archivos antes del build
RUN echo "=== PRE-BUILD VERIFICACIÓN ===" && \
    echo "Archivos principales:" && \
    ls -la && \
    echo "Package.json scripts:" && \
    cat package.json | grep -A 10 '"scripts"' || echo "No scripts found" && \
    echo "Next.js config:" && \
    ls -la next.config.* 2>/dev/null || echo "No next.config encontrado" && \
    echo "Dependencias instaladas:" && \
    ls node_modules/ | wc -l && echo "paquetes en node_modules"

# Construir aplicación Next.js con máximo detalle de debug
RUN echo "=== CONSTRUYENDO NEXT.JS ===" && \
    echo "Variables de entorno para build:" && \
    echo "NODE_ENV=$NODE_ENV" && \
    echo "NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED" && \
    echo "SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION" && \
    echo "=== INICIANDO BUILD VERBOSE ===" && \
    npm run build --verbose 2>&1 | tee /tmp/build.log || \
    (echo "❌ BUILD FALLÓ - ANÁLISIS COMPLETO:" && \
     echo "=== ÚLTIMAS 50 LÍNEAS DEL BUILD ===" && \
     tail -n 50 /tmp/build.log 2>/dev/null || echo "No hay log de build" && \
     echo "=== VERIFICANDO TYPESCRIPT ===" && \
     npx tsc --noEmit --skipLibCheck 2>&1 | head -20 || echo "TypeScript check falló" && \
     echo "=== VERIFICANDO NEXT.JS CONFIG ===" && \
     node -e "try { require('./next.config.js'); console.log('Config OK'); } catch(e) { console.log('Config Error:', e.message); }" 2>&1 && \
     echo "=== CONTENIDO ACTUAL ===" && \
     find . -maxdepth 2 -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | head -10 && \
     echo "=== ERROR LOGS ===" && \
     find . -name "*.log" -type f -exec tail -10 {} \; 2>/dev/null || echo "No error logs" && \
     exit 1)

# Limpiar dependencias de desarrollo después del build
RUN echo "=== LIMPIEZA POST-BUILD ===" && \
    if [ -f yarn.lock ] && [ -x "$(command -v yarn)" ]; then \
      echo "=== LIMPIANDO CON YARN ===" && \
      yarn install --production --network-timeout 600000 --ignore-engines; \
    else \
      echo "=== LIMPIANDO CON NPM ===" && \
      npm prune --production; \
    fi && \
    echo "=== LIMPIEZA DE CACHE ===" && \
    npm cache clean --force 2>/dev/null || true && \
    rm -rf /tmp/* /var/tmp/* ~/.npm ~/.yarn-cache 2>/dev/null || true

# Cambiar propietario de archivos
RUN chown -R nextjs:nodejs /app

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check robusto
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["npm", "start"]
