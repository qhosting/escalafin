
# 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA EASYPANEL

## ⚠️ IMPORTANTE: Configuración Obligatoria

Para que la aplicación EscalaFin funcione correctamente en EasyPanel, **DEBES** configurar estas variables de entorno en la sección **"Environment Variables"** de tu proyecto.

## 📋 CONFIGURACIÓN COMPLETA

### 1. CONFIGURACIÓN DE BUILD
```
# Build Configuration
Ruta de compilación: .
```

### 2. VARIABLES DE ENTORNO CRÍTICAS

#### 🛢️ Base de Datos (OBLIGATORIO)
```
DATABASE_URL=postgresql://username:password@your-db-host:5432/escalafin_mvp
```
**📝 Nota:** Reemplaza con los datos reales de tu PostgreSQL en EasyPanel

#### 🔐 Autenticación (OBLIGATORIO)
```
NEXTAUTH_SECRET=tu_secreto_super_seguro_de_32_caracteres_minimo_aqui
NEXTAUTH_URL=https://escalafin-escalafin-mvp.vnap16.easypanel.host
```
**📝 Nota:** Genera el NEXTAUTH_SECRET con: `openssl rand -base64 32`

#### 🌍 Ambiente
```
NODE_ENV=production
```

#### 💳 Openpay (Pagos)
```
OPENPAY_MERCHANT_ID=tu_merchant_id_real
OPENPAY_PRIVATE_KEY=tu_private_key_real
OPENPAY_PUBLIC_KEY=tu_public_key_real
OPENPAY_BASE_URL=https://sandbox-api.openpay.mx/v1
```
**📝 Nota:** Para producción, cambia la URL a: `https://api.openpay.mx/v1`

#### ☁️ AWS S3 (Archivos)
```
AWS_ACCESS_KEY_ID=tu_access_key_id_real
AWS_SECRET_ACCESS_KEY=tu_secret_access_key_real
AWS_BUCKET_NAME=tu_bucket_name_real
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=escalafin/
```

#### 📱 WhatsApp (EvolutionAPI)
```
EVOLUTION_API_URL=https://tu-evolution-api.com
EVOLUTION_API_TOKEN=tu_token_evolution_real
EVOLUTION_INSTANCE_NAME=escalafin
```

## 🚀 PASOS PARA CONFIGURAR EN EASYPANEL

### 1. Corregir Configuración GitHub
- **Propietario:** `qhosting`
- **Repositorio:** `escalafin-mvp`
- **Rama:** `main`
- **Ruta de compilación:** `.` (solo un punto)

### 2. Configurar Variables de Entorno
1. Ve a tu proyecto en EasyPanel
2. Busca la sección **"Environment Variables"**
3. Añade cada variable con su valor correspondiente
4. **IMPORTANTE:** Reemplaza todos los `tu_xxxxx` con valores reales

### 3. Variables Mínimas para Funcionar
Si no tienes todas las credenciales, al menos configura estas para que la app inicie:

```
DATABASE_URL=postgresql://username:password@host:5432/database
NEXTAUTH_SECRET=un_secreto_de_al_menos_32_caracteres_aqui_123456789
NEXTAUTH_URL=https://escalafin-escalafin-mvp.vnap16.easypanel.host
NODE_ENV=production
```

## ✅ VERIFICAR FUNCIONAMIENTO

Después de configurar:
1. Guarda todos los cambios
2. Despliega la aplicación
3. Verifica que responda: `https://escalafin-escalafin-mvp.vnap16.easypanel.host/api/health`
4. Debe retornar: `{"status":"OK",...}`

## 🆘 SOLUCIÓN RÁPIDA

Si no tienes credenciales externas, usa estos valores temporales:

```
# Temporales para que funcione la app
OPENPAY_MERCHANT_ID=sandbox_merchant
OPENPAY_PRIVATE_KEY=sandbox_private_key
OPENPAY_PUBLIC_KEY=sandbox_public_key
OPENPAY_BASE_URL=https://sandbox-api.openpay.mx/v1

AWS_ACCESS_KEY_ID=temp_access_key
AWS_SECRET_ACCESS_KEY=temp_secret_key
AWS_BUCKET_NAME=temp-bucket
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=temp/

EVOLUTION_API_URL=https://temp-evolution.com
EVOLUTION_API_TOKEN=temp_token
EVOLUTION_INSTANCE_NAME=temp_instance
```

**⚠️ RECUERDA:** Reemplaza los valores temporales con credenciales reales antes de usar en producción.
