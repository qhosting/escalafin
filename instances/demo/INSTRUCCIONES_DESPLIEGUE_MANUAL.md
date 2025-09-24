
# 🚀 Instrucciones para Desplegar Instancia DEMO

## 📋 Resumen
- **Instancia:** demo
- **Dominio:** demo.escalafin.com  
- **Puerto:** 3001
- **Archivos preparados en:** `/tmp/escalafin-instances/demo`

---

## ⚡ Pasos para Despliegue Manual

### 1️⃣ **Copiar Archivos al Servidor**
```bash
# Desde tu máquina local con acceso SSH
scp -r /tmp/escalafin-instances/demo root@adm.escalafin.com:/opt/coolify/instances/
```

### 2️⃣ **Conectar al Servidor**
```bash
ssh root@adm.escalafin.com
```

### 3️⃣ **Navegar al Directorio**
```bash
cd /opt/coolify/instances/demo
```

### 4️⃣ **Cargar Variables de Entorno**
```bash
export $(cat .env.demo | xargs)
```

### 5️⃣ **Desplegar con Docker Compose**
```bash
# Detener instancia anterior si existe
docker-compose -f docker-compose.demo.yml down 2>/dev/null || true

# Construir y desplegar
docker-compose -f docker-compose.demo.yml up -d --build
```

### 6️⃣ **Verificar Estado**
```bash
# Ver estado de contenedores
docker-compose -f docker-compose.demo.yml ps

# Ver logs
docker-compose -f docker-compose.demo.yml logs -f app_demo
```

---

## 🔧 **Configuración Post-Despliegue**

### A) **Configurar DNS**
En tu proveedor de DNS, agregar:
```
demo.escalafin.com A adm.escalafin.com
```

### B) **Configurar SSL en Coolify**
1. Ir a Coolify Dashboard
2. Agregar el dominio `demo.escalafin.com`
3. Habilitar SSL automático

### C) **Configurar Proxy Inverso (Opcional)**
```nginx
# /etc/nginx/sites-available/demo.escalafin.com
server {
    listen 443 ssl http2;
    server_name demo.escalafin.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 **URLs de Acceso**

| Servicio | URL |
|----------|-----|
| **Aplicación** | https://demo.escalafin.com |
| **Admin Panel** | https://demo.escalafin.com/admin |
| **API Health** | https://demo.escalafin.com/api/health |
| **Acceso Directo** | http://adm.escalafin.com:3001 |

---

## 👤 **Credenciales de Prueba**

| Rol | Email | Password |
|-----|-------|----------|
| **Admin** | admin@escalafin.com | admin123 |
| **Asesor** | asesor1@escalafin.com | asesor123 |
| **Cliente** | cliente1@escalafin.com | cliente123 |

---

## 🛠️ **Comandos Útiles**

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.demo.yml logs -f

# Reiniciar aplicación
docker-compose -f docker-compose.demo.yml restart app_demo

# Reiniciar todo
docker-compose -f docker-compose.demo.yml restart

# Detener todo
docker-compose -f docker-compose.demo.yml down

# Ver uso de recursos
docker stats escalafin_app_demo escalafin_db_demo escalafin_redis_demo
```

---

## 📋 **Variables de Entorno Configuradas**

```env
# Aplicación
NODE_ENV=production
NEXTAUTH_URL=https://demo.escalafin.com
PORT=3001

# Base de Datos
DATABASE_URL=postgresql://escalafin_demo:HviywCjG4qO9DGhtpxRjEw@db_demo:5432/escalafin_demo
POSTGRES_USER=escalafin_demo
POSTGRES_DB=escalafin_demo

# Servicios Externos (Configurar después)
AWS_BUCKET_NAME=demo-files
AWS_FOLDER_PREFIX=demo/
EVOLUTION_INSTANCE_NAME=demo
OPENPAY_BASE_URL=https://api.openpay.mx/v1
```

---

## 🆘 **Solución de Problemas**

### ❌ **Si la aplicación no inicia:**
```bash
# Verificar logs de la app
docker logs escalafin_app_demo

# Verificar logs de la BD
docker logs escalafin_db_demo

# Reiniciar en orden
docker-compose -f docker-compose.demo.yml restart db_demo
sleep 10
docker-compose -f docker-compose.demo.yml restart app_demo
```

### ❌ **Si no se conecta a la BD:**
```bash
# Verificar conectividad
docker exec escalafin_app_demo ping db_demo

# Verificar BD
docker exec escalafin_db_demo pg_isready -U escalafin_demo
```

### ❌ **Si el dominio no resuelve:**
1. Verificar configuración DNS
2. Verificar Coolify proxy
3. Verificar puertos abiertos

---

## ✅ **Checklist de Verificación**

- [ ] Archivos copiados al servidor
- [ ] Variables de entorno cargadas
- [ ] Contenedores funcionando
- [ ] Aplicación responde en puerto 3001
- [ ] DNS configurado para demo.escalafin.com
- [ ] SSL configurado
- [ ] Login funciona con credenciales de prueba

---

**🎉 ¡Tu instancia DEMO estará lista después de estos pasos!**
