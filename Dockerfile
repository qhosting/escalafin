
# ESCALAFIN MVP - DOCKERFILE v6.1 YARN FIX
# COPIA DIRECTA desde app/ + Yarn preinstalado
FROM node:18-alpine

# Labels únicos para invalidar cache
LABEL maintainer="escalafin-build@2025-09-23"
LABEL version="6.1-yarn-fix"
LABEL build-date="2025-09-23T16:00:00Z"

# Instalar dependencias del sistema y yarn
RUN apk add --no-cache \
    libc6-compat \
    curl \
    git \
    && rm -rf /var/cache/apk/* \
    && npm install -g yarn@1.22.19

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

# Instalar dependencias de producción
RUN echo "=== INSTALACIÓN DE DEPENDENCIAS ===" && \
    echo "Yarn version: $(yarn --version)" && \
    if [ -f yarn.lock ]; then \
      echo "=== USANDO YARN ===" && \
      yarn config set network-timeout 600000 && \
      yarn install --production --network-timeout 600000 --ignore-engines; \
    elif [ -f package-lock.json ]; then \
      echo "=== USANDO NPM (lockfile) ===" && \
      npm ci --only=production --legacy-peer-deps; \
    else \
      echo "=== USANDO NPM (sin lockfile) ===" && \
      npm install --only=production --legacy-peer-deps; \
    fi

# Generar cliente Prisma si existe
RUN if [ -f prisma/schema.prisma ]; then \
      echo "=== GENERANDO CLIENTE PRISMA ===" && \
      npx prisma generate; \
    else \
      echo "=== NO HAY SCHEMA PRISMA ===" && \
      ls -la prisma/ 2>/dev/null || echo "No hay directorio prisma/"; \
    fi

# Construir aplicación Next.js
RUN echo "=== CONSTRUYENDO NEXT.JS ===" && \
    npm run build

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
