
# ESCALAFIN MVP - DOCKERFILE v5.0 COPIA MEJORADA
# SOLUCIÓN ESPECÍFICA para estructura app/ de EscalaFin
FROM node:18-alpine

# Labels únicos para invalidar cache
LABEL maintainer="escalafin-build@2025-09-23"
LABEL version="5.0-copia-mejorada"
LABEL build-date="2025-09-23T07:15:00Z"

# Instalar dependencias del sistema
RUN apk add --no-cache \
    libc6-compat \
    curl \
    git \
    && rm -rf /var/cache/apk/*

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

# Copiar todos los archivos del contexto
COPY . /tmp/source

# ESTRATEGIA MEJORADA: Copia robusta desde app/
RUN echo "=== DEBUGGING BUILD CONTEXT ===" && \
    echo "Contenido de /tmp/source:" && \
    ls -la /tmp/source/ && \
    echo "" && \
    if [ -d "/tmp/source/app" ]; then \
      echo "=== ENCONTRADO: /tmp/source/app ===" && \
      echo "Contenido de /tmp/source/app/:" && \
      ls -la /tmp/source/app/ && \
      echo "" && \
      echo "=== COPIANDO ARCHIVOS ===" && \
      cp -rv /tmp/source/app/* /app/ 2>/dev/null || echo "Error copiando archivos visibles" && \
      cp -rv /tmp/source/app/.* /app/ 2>/dev/null || echo "Error copiando archivos ocultos (normal)" && \
      echo "=== COPIA COMPLETADA ===" && \
      ls -la /app/ && \
      echo "" && \
      echo "=== BUSCANDO package.json ===" && \
      find /app -name "package.json" -type f && \
      ls -la /app/package.json 2>/dev/null || echo "package.json no encontrado en /app/" \
    ; elif [ -f "/tmp/source/package.json" ]; then \
      echo "=== CONTEXTO DIRECTO ===" && \
      cp -rv /tmp/source/* /app/ && \
      cp -rv /tmp/source/.* /app/ 2>/dev/null || true \
    ; else \
      echo "=== ERROR: CONFIGURACIÓN NO VÁLIDA ===" && \
      exit 1 \
    ; fi

# Limpiar directorio temporal
RUN rm -rf /tmp/source

# VALIDACIÓN ESPECÍFICA: Buscar package.json
RUN echo "=== VALIDACIÓN FINAL ===" && \
    echo "Archivos en /app/:" && \
    ls -la /app/ && \
    echo "" && \
    if [ -f "/app/package.json" ]; then \
      echo "✅ package.json encontrado en /app/package.json" && \
      head -5 /app/package.json; \
    else \
      echo "❌ package.json NO encontrado" && \
      echo "Buscando en subdirectorios:" && \
      find /app -name "package.json" -type f 2>/dev/null || echo "No se encontró package.json en ninguna parte" && \
      exit 1; \
    fi

# Instalar dependencias de producción
RUN if [ -f yarn.lock ]; then \
      echo "=== USANDO YARN ===" && \
      yarn install --production --network-timeout 300000 --frozen-lockfile; \
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
