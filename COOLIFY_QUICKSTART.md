
# ⚡ Inicio Rápido - Coolify Deployment

## 🚀 Despliegue en 5 Minutos

### 1. Configuración Rápida
```bash
# Ejecutar configuración automática
./coolify-quick-setup.sh
```

### 2. Editar Variables Críticas
```bash
# Editar archivo generado
nano .env.production

# Variables OBLIGATORIAS a configurar:
OPENPAY_MERCHANT_ID=tu_merchant_id
OPENPAY_PRIVATE_KEY=tu_private_key
OPENPAY_PUBLIC_KEY=tu_public_key

AWS_ACCESS_KEY_ID=tu_aws_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret
AWS_BUCKET_NAME=escalafin-files

EVOLUTION_API_URL=https://tu-whatsapp-api.com
EVOLUTION_API_TOKEN=tu_token
```

### 3. Crear Proyecto en Coolify
1. Ve a: `https://adm.escalafin.com`
2. Nuevo Proyecto → `escalafin-mvp`
3. Conectar GitHub → Tu repositorio
4. Usar: `docker-compose.coolify.yml`

### 4. Configurar Variables
En Coolify:
- Settings → Environment Variables
- Import from `.env.production`
- Deploy

### 5. Configurar Dominio
- Domains → Add Domain
- `escalafin.com` + `www.escalafin.com`
- SSL: Let's Encrypt Auto

## ✅ Verificación

### URLs de prueba:
- App: https://escalafin.com
- Health: https://escalafin.com/api/health
- Admin: https://escalafin.com/admin

### Credenciales por defecto:
- Admin: `admin@escalafin.com` / `admin123`

## 🆘 Problemas?
```bash
# Ver logs
./deploy-coolify.sh logs

# Estado de servicios
./deploy-coolify.sh status

# Rollback si es necesario
./deploy-coolify.sh rollback
```

**📖 Guía completa:** `COOLIFY_DEPLOYMENT_GUIDE.md`
