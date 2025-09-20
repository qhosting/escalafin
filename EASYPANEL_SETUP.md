
# 🚀 Configuración Easypanel - EscalaFin

## 📋 Guía Completa para Despliegue en Easypanel

Esta guía te lleva paso a paso para desplegar EscalaFin en Easypanel con todas las configuraciones necesarias.

---

## ✅ Pre-requisitos

- [ ] Cuenta en Easypanel
- [ ] Repositorio GitHub configurado
- [ ] Credenciales de producción listas
- [ ] Dominio personalizado (opcional)

---

## 🏗️ Paso 1: Preparar el Proyecto para Easypanel

### 1.1 Crear Dockerfile optimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 1.2 Actualizar next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  
  // Optimizaciones para Easypanel
  experimental: {
    outputFileTracingRoot: "/app",
  },
  
  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Webpack optimizations
  webpack: (config) => {
    config.externals.push('@node-rs/argon2', '@node-rs/bcrypt');
    return config;
  },
};

module.exports = nextConfig;
```

### 1.3 Crear .dockerignore

```dockerignore
# Node modules
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next
out

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
README.md
CHANGELOG.md
*.md

# Docker
Dockerfile
docker-compose.yml
.dockerignore

# Logs
*.log
logs

# Temporary files
tmp
temp

# Build artifacts
build
dist

# Test coverage
coverage

# Uploads (will be in S3)
uploads
```

---

## 🛠️ Paso 2: Configurar en Easypanel

### 2.1 Crear Nueva Aplicación

1. **Login en Easypanel**
   - Acceder a tu dashboard
   - Seleccionar el servidor/proyecto

2. **Crear Servicio de Aplicación**
   - Nombre: `escalafin-app`
   - Tipo: `App`
   - Source: `GitHub Repository`

3. **Configurar Repositorio**
   - Conectar cuenta GitHub
   - Seleccionar repositorio `escalafin-mvp`
   - Branch: `main`
   - Build Path: `/app` (importante)

### 2.2 Configurar Base de Datos

1. **Crear Servicio PostgreSQL**
   - Nombre: `escalafin-db`
   - Tipo: `Database` → `PostgreSQL`
   - Version: `14` o superior
   - Storage: `10GB` (mínimo)

2. **Configurar Credenciales**
   ```
   Database Name: escalafin
   Username: escalafin_user
   Password: [generar password seguro]
   ```

3. **Configurar Backups**
   - Backups automáticos: `Habilitado`
   - Frecuencia: `Diario`
   - Retención: `7 días`

### 2.3 Variables de Entorno

**En Easypanel → App → Environment Variables:**

```env
# Producción
NODE_ENV=production
NEXTAUTH_DEBUG=false

# URLs (actualizar con tu dominio)
NEXTAUTH_URL=https://tu-app-nombre.tu-panel.app

# Base de Datos (Easypanel proporcionará estos valores)
DATABASE_URL=postgresql://escalafin_user:tu_password@escalafin-db:5432/escalafin

# Autenticación (generar nuevo secret para producción)
NEXTAUTH_SECRET=tu_secret_super_seguro_de_produccion_min_32_chars

# Openpay PRODUCCIÓN (cambiar por valores reales)
OPENPAY_MERCHANT_ID=tu_merchant_id_real
OPENPAY_PRIVATE_KEY=tu_private_key_real
OPENPAY_PUBLIC_KEY=tu_public_key_real
OPENPAY_BASE_URL=https://api.openpay.mx/v1

# AWS S3 PRODUCCIÓN
AWS_ACCESS_KEY_ID=tu_access_key_produccion
AWS_SECRET_ACCESS_KEY=tu_secret_key_produccion
AWS_BUCKET_NAME=escalafin-production
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=production/

# WhatsApp PRODUCCIÓN
EVOLUTION_API_URL=https://tu-evolution-api-produccion.com
EVOLUTION_API_TOKEN=tu_token_evolution_produccion
EVOLUTION_INSTANCE_NAME=escalafin-production
```

### 2.4 Configurar Build

**Build Settings:**
```yaml
Build Command: |
  cd app &&
  yarn install --frozen-lockfile &&
  npx prisma generate &&
  yarn build

Start Command: |
  cd app &&
  node server.js

Port: 3000
```

---

## 🎯 Paso 3: Primera Implementación

### 3.1 Desplegar Aplicación

1. **Iniciar Build**
   - Click en `Deploy`
   - Monitorear logs en tiempo real
   - Verificar que build complete exitosamente

2. **Verificar Status**
   - App status: `Running`
   - Database status: `Running`
   - No errores en logs

### 3.2 Inicializar Base de Datos

**Ejecutar una sola vez después del primer despliegue:**

```bash
# Conectar vía SSH o ejecutar comando en Easypanel
cd app
npx prisma db push
npx prisma db seed
```

### 3.3 Verificar Funcionamiento

1. **Acceder a la aplicación**
   - URL temporal: `https://tu-app.tu-panel.app`
   - Verificar que carga correctamente

2. **Probar funcionalidades básicas**
   - Login con usuario admin
   - Crear un cliente de prueba
   - Verificar que base de datos funciona

---

## 🌐 Paso 4: Configurar Dominio Personalizado

### 4.1 En Easypanel

1. **Agregar Dominio**
   - App Settings → Domains
   - Agregar: `escalafin.tudominio.com`
   - SSL: `Auto (Let's Encrypt)`

### 4.2 Configurar DNS

**En tu proveedor de DNS:**
```
Tipo: CNAME
Nombre: escalafin (o @)
Valor: tu-app.tu-panel.app
TTL: 300
```

### 4.3 Actualizar Variables

```env
NEXTAUTH_URL=https://escalafin.tudominio.com
```

---

## 📊 Paso 5: Configuraciones Post-Despliegue

### 5.1 Configurar Webhooks

**Openpay Webhook:**
- URL: `https://escalafin.tudominio.com/api/webhooks/openpay`
- Eventos: `charge.succeeded`, `charge.failed`, `charge.cancelled`

**EvolutionAPI Webhook:**
- URL: `https://escalafin.tudominio.com/api/webhooks/evolution-api`

### 5.2 Configurar Monitoreo

```yaml
# En Easypanel → Monitoring
Health Check:
  Path: /api/health
  Interval: 30s
  Timeout: 10s

Resource Limits:
  CPU: 1 vCore
  Memory: 1GB
  Storage: 5GB
```

### 5.3 Configurar Backups

```yaml
Database Backup:
  Schedule: Daily at 2:00 AM
  Retention: 7 days
  
App Files:
  Files in S3 (automático)
  Logs: 3 días retención
```

---

## 🔒 Paso 6: Seguridad en Producción

### 6.1 Cambiar Credenciales por Defecto

```sql
-- Conectar a la base de datos y cambiar passwords
UPDATE "User" SET 
  password = '$2a$12$nuevo_hash_password_admin'
WHERE email = 'admin@escalafin.com';

UPDATE "User" SET 
  password = '$2a$12$nuevo_hash_password_asesor'
WHERE email = 'asesor@escalafin.com';

-- O mejor, crear usuarios nuevos y eliminar los de prueba
```

### 6.2 Configurar Rate Limiting

```env
# Agregar a variables de entorno
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

### 6.3 Configurar CORS

```javascript
// En next.config.js
async headers() {
  return [
    {
      source: '/api/(.*)',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://escalafin.tudominio.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ];
}
```

---

## 📈 Paso 7: Optimizaciones de Rendimiento

### 7.1 Configurar CDN

```javascript
// En next.config.js
images: {
  domains: ['tu-bucket.s3.amazonaws.com'],
  loader: 'cloudinary', // o el CDN que prefieras
}
```

### 7.2 Configurar Cache

```env
# Redis para caché (opcional)
REDIS_URL=redis://redis-service:6379
ENABLE_CACHE=true
```

### 7.3 Optimizar Base de Datos

```sql
-- Crear índices importantes
CREATE INDEX CONCURRENTLY idx_loans_client_id ON "Loan" (client_id);
CREATE INDEX CONCURRENTLY idx_payments_loan_id ON "Payment" (loan_id);
CREATE INDEX CONCURRENTLY idx_audit_created_at ON "AuditLog" (created_at);
```

---

## 🚀 Paso 8: Automatización de Despliegues

### 8.1 Configurar Auto-Deploy

**En Easypanel:**
1. App Settings → Git
2. Auto Deploy: `Enabled`
3. Branch: `main`
4. Deploy on push: `Yes`

### 8.2 Pipeline de CI/CD

```yaml
# .github/workflows/deploy-easypanel.yml
name: Deploy to Easypanel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Easypanel
      uses: easypanel/deploy-action@v1
      with:
        easypanel-url: ${{ secrets.EASYPANEL_URL }}
        easypanel-token: ${{ secrets.EASYPANEL_TOKEN }}
        app-name: escalafin-app
```

---

## ✅ Checklist Final de Verificación

### 🌐 **Aplicación**
- [ ] App desplegada y corriendo
- [ ] SSL configurado y funcionando
- [ ] Dominio personalizado configurado
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas

### 🔧 **Funcionalidades**
- [ ] Login funciona correctamente
- [ ] Crear cliente funciona
- [ ] Crear préstamo funciona
- [ ] Pagos con Openpay funcionan
- [ ] Notificaciones WhatsApp funcionan
- [ ] Upload de archivos a S3 funciona
- [ ] Reportes se generan correctamente

### 🔒 **Seguridad**
- [ ] HTTPS habilitado
- [ ] Variables de entorno de producción
- [ ] Credenciales por defecto cambiadas
- [ ] Webhooks configurados
- [ ] Backups automáticos habilitados

### 📊 **Monitoreo**
- [ ] Health checks configurados
- [ ] Logs funcionando
- [ ] Métricas de performance
- [ ] Alertas configuradas

---

## 🆘 Solución de Problemas

### Build Failures

```bash
# Error: Node modules not found
# Solución: Verificar que yarn.lock está en el repo

# Error: Prisma client not generated
# Solución: Agregar "npx prisma generate" al build command

# Error: Out of memory
# Solución: Aumentar memoria en Easypanel o usar NODE_OPTIONS="--max-old-space-size=4096"
```

### Runtime Errors

```bash
# Error: Database connection failed
# Solución: Verificar DATABASE_URL y que la DB esté corriendo

# Error: NextAuth configuration error
# Solución: Verificar NEXTAUTH_SECRET y NEXTAUTH_URL

# Error: 502 Bad Gateway
# Solución: Verificar que la app está corriendo en puerto 3000
```

### Performance Issues

```bash
# App lenta
# Solución: Verificar recursos asignados, optimizar queries

# High memory usage
# Solución: Revisar memory leaks, optimizar componentes React

# Slow database queries
# Solución: Agregar índices, optimizar Prisma queries
```

---

## 🎉 **¡EscalaFin Desplegado Exitosamente en Easypanel!**

### 📝 **Información de Producción**

```
🌐 URL: https://escalafin.tudominio.com
🗄️ Base de Datos: PostgreSQL en Easypanel
🔐 Autenticación: NextAuth con JWT
💳 Pagos: Openpay API (Producción)
📱 WhatsApp: EvolutionAPI (Producción)
🗂️ Archivos: AWS S3 (Bucket de producción)
```

### 📞 **Siguientes Pasos**

1. **Configurar monitoreo avanzado**
2. **Entrenar usuarios finales**
3. **Configurar backups adicionales**
4. **Optimizar performance**
5. **Planificar escalamiento**

**¡Tu sistema EscalaFin está ahora en producción y listo para operaciones reales!** 🚀

---

**© 2025 EscalaFin - Desplegado con éxito en Easypanel** ⚡
