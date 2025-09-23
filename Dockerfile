
# ESCALAFIN MVP - DOCKERFILE v4.0 EASYPANEL FIX
# SOLUCIÓN DEFINITIVA para error "app/ not found" en EasyPanel
FROM node:18-alpine

# Labels únicos para invalidar cache
LABEL maintainer="escalafin-build@2025-09-23"
LABEL version="4.0-easypanel-fix"
LABEL build-date="2025-09-23T06:30:00Z"

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

# ESTRATEGIA MULTI-CONTEXTO: Detectar y copiar archivos automáticamente
RUN echo "Debugging build context..." && \
    ls -la && \
    if [ -d "app" ]; then echo "Found app/ directory"; else echo "No app/ directory found"; fi

# Copiar archivos de la aplicación con detección automática
COPY . /tmp/source

# Mover archivos desde el contexto correcto
RUN if [ -d "/tmp/source/app" ]; then \
      echo "Copiando desde /tmp/source/app/ (contexto raíz)" && \
      cp -r /tmp/source/app/* /app/ && \
      cp -r /tmp/source/app/.* /app/ 2>/dev/null || true; \
    elif [ -f "/tmp/source/package.json" ]; then \
      echo "Copiando desde /tmp/source/ (contexto app)" && \
      cp -r /tmp/source/* /app/ && \
      cp -r /tmp/source/.* /app/ 2>/dev/null || true; \
    else \
      echo "ERROR: No se encontró configuración válida" && \
      ls -la /tmp/source && \
      exit 1; \
    fi

# Limpiar directorio temporal
RUN rm -rf /tmp/source

# Verificar que tenemos los archivos necesarios
RUN echo "Verificando archivos copiados:" && \
    ls -la /app/ && \
    if [ ! -f "/app/package.json" ]; then echo "ERROR: package.json no encontrado" && exit 1; fi

# Instalar dependencias de producción
RUN if [ -f yarn.lock ]; then \
      echo "Usando Yarn..." && \
      yarn install --production --network-timeout 300000 --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      echo "Usando npm con lockfile..." && \
      npm ci --only=production --legacy-peer-deps; \
    else \
      echo "Usando npm sin lockfile..." && \
      npm install --only=production --legacy-peer-deps; \
    fi

# Generar cliente Prisma si existe
RUN if [ -f prisma/schema.prisma ]; then \
      echo "Generando cliente Prisma..." && \
      npx prisma generate; \
    else \
      echo "No se encontró schema de Prisma, omitiendo..."; \
    fi

# Construir aplicación Next.js
RUN echo "Iniciando build de Next.js..." && \
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
