
# 🚀 Guía de Deployment

Esta guía cubre el deployment de proyectos basados en esta plantilla en diferentes plataformas.

---

## 📋 Pre-requisitos

### Requisitos del Sistema
- Docker 20.x o superior
- PostgreSQL 13.x o superior
- Node.js 18.x (para desarrollo local)
- Yarn 1.x

### Requisitos del Proyecto
- ✅ Variables de entorno configuradas
- ✅ Base de datos PostgreSQL disponible
- ✅ Secrets generados
- ✅ Validaciones pre-deployment exitosas

---

## 🎯 Plataformas Soportadas

### 1. EasyPanel (Recomendado)
### 2. Coolify
### 3. Docker Compose (VPS)
### 4. Vercel (Solo frontend)

---

## 🚀 Deployment en EasyPanel

### Paso 1: Preparar Repositorio en GitHub

```bash
# Validar que todo está listo
bash scripts/pre-build-check.sh
bash scripts/pre-deploy-check.sh

# Push a GitHub
git add .
git commit -m "Ready for deployment"
bash scripts/push-github.sh
```

### Paso 2: Configurar Base de Datos en EasyPanel

1. Ir a EasyPanel dashboard
2. Crear nuevo servicio → PostgreSQL
3. Configurar:
   - Nombre: `mi-proyecto-db`
   - Versión: PostgreSQL 13 o superior
   - Usuario: `postgres`
   - Contraseña: (generar segura)
   - Base de datos: `mi_proyecto`

4. Anotar la `DATABASE_URL`:
   ```
   postgresql://postgres:PASSWORD@postgres:5432/mi_proyecto
   ```

### Paso 3: Crear Servicio App en EasyPanel

1. Crear nuevo servicio → GitHub
2. Conectar repositorio
3. Configurar build:
   - Branch: `main`
   - Build: Automático (usa Dockerfile)
   - Puerto: 3000

### Paso 4: Configurar Variables de Entorno

En EasyPanel → Service → Environment:

```bash
# Base de datos
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/mi_proyecto

# NextAuth
NEXTAUTH_URL=https://mi-app.easypanel.host
NEXTAUTH_SECRET=generar-con-script
JWT_SECRET=generar-con-script

# Node
NODE_ENV=production

# Opcional: Storage (AWS S3)
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_BUCKET_NAME=tu_bucket
AWS_REGION=us-east-1
```

**Generar secrets:**
```bash
node generar-secretos.js
```

### Paso 5: Deploy

1. En EasyPanel: Click "Deploy"
2. Monitorear logs en tiempo real
3. Esperar a que health check sea exitoso (30-60 segundos)

### Paso 6: Verificar Deployment

```bash
# Verificar que responde
curl https://mi-app.easypanel.host

# Verificar health
curl https://mi-app.easypanel.host/api/health

# Ver logs
# En EasyPanel dashboard → Logs
```

---

## 🔧 Deployment en Coolify

### Paso 1: Preparar Proyecto

Igual que EasyPanel (validaciones y push a GitHub)

### Paso 2: Configurar en Coolify

1. New Resource → Application
2. Source: GitHub Repository
3. Build Pack: Dockerfile
4. Port: 3000

### Paso 3: Variables de Entorno

En Coolify → Environment Variables:
- (Mismas que EasyPanel)

### Paso 4: Configurar Base de Datos

1. New Resource → Database → PostgreSQL
2. Conectar a la aplicación
3. Usar DATABASE_URL generada

### Paso 5: Deploy

```bash
# Coolify hace deploy automático en push
git push origin main
```

---

## 🐳 Deployment con Docker Compose (VPS)

### Paso 1: Preparar VPS

```bash
# Conectar a VPS
ssh user@tu-servidor.com

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Paso 2: Clonar Proyecto

```bash
git clone https://github.com/tu-usuario/tu-proyecto.git
cd tu-proyecto
```

### Paso 3: Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Contenido:
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mi_proyecto
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu_secret
JWT_SECRET=tu_secret
NODE_ENV=production
```

### Paso 4: Deploy

```bash
# Build y start
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Verificar
curl http://localhost:3000
```

### Paso 5: Configurar Nginx (Opcional)

```bash
# Instalar Nginx
sudo apt update && sudo apt install nginx -y

# Configurar proxy
sudo nano /etc/nginx/sites-available/mi-proyecto
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/mi-proyecto /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configurar SSL con Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

---

## 🔍 Verificación Post-Deployment

### Health Check

```bash
# Verificar que el servicio está activo
curl https://tu-dominio.com/api/health

# Respuesta esperada:
{"status":"ok","database":"connected","timestamp":"2025-10-30T..."}
```

### Logs

```bash
# EasyPanel/Coolify
# Ver logs en dashboard

# Docker Compose
docker-compose logs -f app

# Buscar errores
docker-compose logs app | grep -i error
```

### Base de Datos

```bash
# Verificar migraciones
docker exec -it <container> bash
cd app && yarn prisma migrate status

# Debería mostrar:
# Status: All migrations have been applied
```

---

## 🚨 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Test de conexión
docker exec -it <postgres-container> psql -U postgres
```

### Error: "Prisma Client not generated"

```bash
# Regenerar Prisma Client
docker exec -it <app-container> bash
cd app && yarn prisma generate
exit

# Restart contenedor
docker-compose restart app
```

### Error: "Port 3000 already in use"

```bash
# Ver qué está usando el puerto
sudo lsof -i :3000

# Detener proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"
```

### Build muy lento

```bash
# Limpiar cache Docker
docker system prune -a

# Build sin cache
docker-compose build --no-cache
```

---

## 🔄 CI/CD (GitHub Actions)

### Configurar Webhook para Auto-Deploy

**EasyPanel:**
1. EasyPanel → Service → Settings → Webhooks
2. Copiar webhook URL
3. GitHub → Settings → Webhooks → Add webhook
4. Pegar URL, seleccionar "push" events

**Coolify:**
1. Coolify → Application → General → Build
2. Copiar webhook URL
3. Configurar en GitHub (igual que arriba)

**Resultado:**
- Cada `git push` a `main` dispara deploy automático

---

## 📊 Monitoreo

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Últimas 100 líneas
docker-compose logs --tail=100 app

# Guardar logs
docker-compose logs app > logs.txt
```

### Recursos

```bash
# Ver uso de recursos
docker stats

# Específico del contenedor
docker stats <container-name>
```

### Uptime

```bash
# Configurar health check en monitoreo externo
# Ejemplos: UptimeRobot, Pingdom, StatusCake

# URL a monitorear:
https://tu-dominio.com/api/health

# Intervalo: 5 minutos
# Alert: Si falla 2 veces consecutivas
```

---

## 🔐 Seguridad

### SSL/TLS

- ✅ EasyPanel: Automático con Let's Encrypt
- ✅ Coolify: Automático con Let's Encrypt
- ✅ VPS: Configurar Certbot (ver arriba)

### Secrets

```bash
# NUNCA commitear secrets
# NUNCA loggear secrets
# Rotar secrets regularmente (cada 90 días)

# Generar nuevos secrets
node generar-secretos.js

# Actualizar en plataforma de deployment
```

### Backups

```bash
# Configurar backup automático de BD
# EasyPanel: Activar en DB settings
# Coolify: Configurar backup schedule
# VPS: Cron job

# Ejemplo cron (diario a las 2 AM):
0 2 * * * cd /app && bash backup-db.sh
```

---

## ✅ Checklist Final

- [ ] Validaciones pre-deployment exitosas
- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL activa
- [ ] Secrets generados y seguros
- [ ] SSL/TLS configurado
- [ ] Health check respondiendo
- [ ] Logs sin errores
- [ ] Backups configurados
- [ ] Monitoreo activo
- [ ] Webhooks para auto-deploy

---

**Última actualización:** Octubre 2025  
**Plataformas probadas:** EasyPanel, Coolify, Docker Compose
