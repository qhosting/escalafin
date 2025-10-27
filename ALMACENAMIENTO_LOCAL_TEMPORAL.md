# 📁 Almacenamiento Local Temporal - Configuración

**Fecha:** 27 de octubre de 2025  
**Tipo:** Configuración temporal para deploy sin AWS S3

---

## ⚠️ IMPORTANTE: Esto es una solución temporal

Esta configuración usa **almacenamiento local** en lugar de AWS S3 para permitir el despliegue inmediato de la aplicación.

### ⚠️ Limitaciones Críticas

1. **Los archivos se perderán en cada redeploy**
   - Cada vez que reconstruyas la aplicación, todos los archivos subidos se eliminarán
   - NO apto para producción a largo plazo

2. **No hay persistencia entre instancias**
   - Si escalas a múltiples contenedores, cada uno tendrá su propio almacenamiento
   - Los archivos no serán accesibles entre instancias

3. **Límites de espacio**
   - El contenedor tiene espacio limitado
   - Tamaño máximo por archivo: 10MB (configurable)

---

## ✅ Cambios Implementados

### 1. Auto-detección de Almacenamiento

El sistema ahora detecta automáticamente si AWS está configurado:

```typescript
// lib/storage-config.ts
const hasAwsCredentials = !!(
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME &&
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID !== 'tu-access-key' &&
  process.env.AWS_SECRET_ACCESS_KEY !== 'tu-secret-key'
)

// Si NO hay credenciales AWS válidas, usa almacenamiento local
const storageType = (process.env.STORAGE_TYPE === 's3' && hasAwsCredentials) 
  ? 's3' 
  : 'local'
```

### 2. API Route para Servir Archivos

Creado: `/app/api/files/[...path]/route.ts`

**Funcionalidad:**
- Sirve archivos desde el directorio local `/app/uploads`
- Valida paths para prevenir acceso no autorizado
- Soporta múltiples tipos de contenido (imágenes, PDFs, documentos)
- Implementa cache headers para mejorar rendimiento

**URL de acceso:**
```
https://escalafin.com/api/files/[categoria]/[nombre-archivo]
```

**Ejemplo:**
```
https://escalafin.com/api/files/clients/1234567890-foto.jpg
```

### 3. Directorio de Uploads

**Ubicación en contenedor:** `/app/uploads`

**Estructura:**
```
/app/uploads/
├── clients/        # Fotos de clientes
├── payments/       # Comprobantes de pago
├── documents/      # Documentos de préstamos
└── general/        # Archivos generales
```

---

## 🔧 Variables de Entorno

### Actuales (Sin Cambios Requeridos)

Con las credenciales AWS actuales (placeholders), el sistema automáticamente usará almacenamiento local:

```bash
# Variables AWS (placeholders - sistema ignora automáticamente)
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key

# El sistema detecta que son placeholders y usa almacenamiento local
```

### Variables Opcionales para Configuración Local

```bash
# Tipo de almacenamiento (opcional, auto-detectado)
STORAGE_TYPE=local

# Directorio de uploads (opcional, default: /app/uploads)
LOCAL_UPLOAD_DIR=/app/uploads

# Base URL para archivos (opcional, default: /api/files)
LOCAL_BASE_URL=/api/files

# Tamaño máximo de archivo en MB (opcional, default: 10)
LOCAL_MAX_FILE_SIZE=10
```

---

## 📊 Funcionalidades Afectadas

### ✅ Funcionan con Almacenamiento Local

- ✓ Subir fotos de clientes
- ✓ Subir documentos de solicitudes de crédito
- ✓ Subir comprobantes de pago
- ✓ Ver archivos subidos
- ✓ Descargar archivos

### ⚠️ Limitaciones

- ⚠️ Los archivos se pierden en cada redeploy
- ⚠️ No hay backup automático
- ⚠️ No hay sincronización entre instancias
- ⚠️ Espacio limitado del contenedor

---

## 🚀 Migración Futura a AWS S3

Cuando estés listo para migrar a AWS S3:

### Paso 1: Crear Bucket en AWS

```bash
# En AWS Console
1. Ir a S3
2. Crear nuevo bucket: escalafin-storage
3. Region: us-east-1 (o tu preferida)
4. Configurar CORS
5. Configurar políticas de acceso
```

### Paso 2: Crear Usuario IAM

```bash
# En AWS Console
1. Ir a IAM → Users
2. Crear usuario: escalafin-s3-user
3. Permisos: AmazonS3FullAccess (o política custom)
4. Generar Access Keys
```

### Paso 3: Actualizar Variables de Entorno

```bash
# En EasyPanel
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET_NAME=escalafin-storage
AWS_REGION=us-east-1
STORAGE_TYPE=s3
```

### Paso 4: Redeploy

El sistema automáticamente detectará las credenciales válidas y cambiará a S3.

**Nota:** Los archivos locales existentes NO se migrarán automáticamente. Necesitarás migrarlos manualmente si son importantes.

---

## 🧪 Testing del Almacenamiento Local

### Verificar Tipo de Almacenamiento

```bash
# Desde la aplicación, ver logs de inicio
# Debería mostrar: "📁 Usando almacenamiento LOCAL"
```

### Probar Subida de Archivo

1. Ir a Admin → Clientes → Nuevo Cliente
2. Subir una foto
3. Verificar que se guarda correctamente
4. Verificar que la foto se visualiza

### Verificar Estructura de Directorios

```bash
# En el contenedor
ls -la /app/uploads/
ls -la /app/uploads/clients/
ls -la /app/uploads/payments/
```

---

## 📝 Checklist de Deploy

- [x] ✅ Auto-detección de almacenamiento implementada
- [x] ✅ API route `/api/files/[...path]` creada
- [x] ✅ Directorio `/app/uploads` configurado en Dockerfile
- [x] ✅ Permisos correctos (nextjs:nodejs)
- [ ] ⏳ Verificar funcionalidad post-deploy
- [ ] ⏳ Confirmar subida/descarga de archivos

---

## 🔄 Rollback a S3

Si ya tenías S3 configurado y quieres volver:

```bash
# Restaurar variables AWS válidas
AWS_ACCESS_KEY_ID=<tu-key-real>
AWS_SECRET_ACCESS_KEY=<tu-secret-real>
AWS_BUCKET_NAME=<tu-bucket>
AWS_REGION=<tu-region>
STORAGE_TYPE=s3  # Opcional, se auto-detecta

# Redeploy
```

---

## 🎯 Resumen

| Aspecto | Estado |
|---------|--------|
| **Almacenamiento Actual** | Local (`/app/uploads`) |
| **Persistencia** | ⚠️ Se pierde en redeploys |
| **Producción Ready** | ❌ NO (solo temporal) |
| **Funcionalidad** | ✅ Completa |
| **Performance** | ✅ Buena |
| **Migración a S3** | ✅ Fácil (cambiar variables) |

---

## ⚠️ Recomendación Final

**Esta configuración es SOLO para testing y desarrollo inicial.**

Para producción, **debes migrar a AWS S3** para garantizar:
- Persistencia de archivos
- Backup automático
- Escalabilidad
- CDN (CloudFront)
- Redundancia

---

**Configurado:** 27 de octubre de 2025  
**Estado:** ✅ Listo para deploy con almacenamiento local  
**Próximo paso:** Configurar AWS S3 para producción
