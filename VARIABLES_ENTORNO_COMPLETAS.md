
# 🔐 Variables de Entorno Completas para EasyPanel

## 📊 Estado Actual

Tienes configuradas **9 variables** pero faltan **8 variables críticas** para que EscalaFin funcione completamente.

---

## ✅ Variables que YA Tienes Configuradas

```env
DATABASE_URL=postgresql://postgres:fa8853b6e623ed411e27@cloudmx_escalafin-db:5432/escalafin-db?schema=public
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=8mK9nL0pQ1rS2tU3vW4xY5zA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9
JWT_SECRET=5tU6vW7xY8zA9bC0dE1fG2hI3jK4lM5nO6pQ7rS8tU9vW0xY1zA2bC3dE4fG5hI6
NODE_ENV=production
PORT=3000
EVOLUTION_API_URL=https://tu-servidor.com
EVOLUTION_API_KEY=tu-key
EVOLUTION_INSTANCE=instancia
```

**Estado**: ✅ Correctas (excepto Evolution que tiene valores placeholder)

---

## ❌ Variables que FALTAN (Críticas)

### 1. AWS S3 (Almacenamiento de Archivos)

```env
AWS_BUCKET_NAME=tu-bucket-s3
AWS_FOLDER_PREFIX=escalafin/
AWS_REGION=us-east-1
```

**¿Qué son?**
- AWS S3 se usa para guardar documentos de clientes (identificaciones, comprobantes, etc.)
- Sin estas variables, no podrás subir ni descargar archivos

**¿Cómo obtenerlas?**
1. Ve a [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Crea un bucket (o usa uno existente)
3. Copia el nombre del bucket
4. Región: generalmente `us-east-1` o `us-west-2`

**Valores de ejemplo**:
```env
AWS_BUCKET_NAME=escalafin-prod-storage
AWS_FOLDER_PREFIX=uploads/
AWS_REGION=us-east-1
```

---

### 2. Openpay (Pagos)

```env
OPENPAY_MERCHANT_ID=m5ag0krshs9byhjssp69
OPENPAY_PRIVATE_KEY=sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
OPENPAY_PUBLIC_KEY=pk_1572d7631ef94115901466d396af54d3
OPENPAY_BASE_URL=https://api.openpay.mx/v1
OPENPAY_CLIENT_ID=root@cloudmx.site
```

**¿Qué son?**
- Openpay procesa los pagos de tus clientes
- Sin estas variables, no podrás cobrar ni procesar préstamos

**✅ YA LAS TENGO - Tus Credenciales Reales**:
```env
OPENPAY_MERCHANT_ID=m5ag0krshs9byhjssp69
OPENPAY_PRIVATE_KEY=sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
OPENPAY_PUBLIC_KEY=pk_1572d7631ef94115901466d396af54d3
OPENPAY_BASE_URL=https://api.openpay.mx/v1
OPENPAY_CLIENT_ID=root@cloudmx.site
```

**Nota**: Usa `https://api.openpay.mx/v1` para producción o `https://sandbox-api.openpay.mx/v1` para pruebas.

---

### 3. Evolution API (WhatsApp) - Corregir

Tienes estas variables **con valores placeholder**:
```env
EVOLUTION_API_URL=https://tu-servidor.com    ❌ Placeholder
EVOLUTION_API_KEY=tu-key                      ❌ Placeholder
EVOLUTION_INSTANCE=instancia                  ❌ Placeholder
```

**Cambio necesario**: El código usa `EVOLUTION_API_TOKEN`, no `EVOLUTION_API_KEY`

**Variables correctas**:
```env
EVOLUTION_API_URL=https://evo.whatscloud.site
EVOLUTION_API_TOKEN=AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
EVOLUTION_INSTANCE_NAME=escalafin_instance
```

**Valores reales** (ya los tengo de tus configuraciones):
```env
EVOLUTION_API_URL=https://evo.whatscloud.site
EVOLUTION_API_TOKEN=AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
EVOLUTION_INSTANCE_NAME=escalafin_prod
```

---

## 📋 LISTA COMPLETA - Copia y Pega en EasyPanel

### Variables de Base de Datos y Autenticación (Ya las tienes)

```env
DATABASE_URL=postgresql://postgres:fa8853b6e623ed411e27@cloudmx_escalafin-db:5432/escalafin-db?schema=public
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=8mK9nL0pQ1rS2tU3vW4xY5zA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9
JWT_SECRET=5tU6vW7xY8zA9bC0dE1fG2hI3jK4lM5nO6pQ7rS8tU9vW0xY1zA2bC3dE4fG5hI6
NODE_ENV=production
PORT=3000
```

### Variables de AWS S3 (AGREGAR)

```env
AWS_BUCKET_NAME=escalafin-prod-storage
AWS_FOLDER_PREFIX=uploads/
AWS_REGION=us-east-1
```

**⚠️ IMPORTANTE**: Reemplaza `escalafin-prod-storage` con el nombre de tu bucket real de AWS.

### Variables de Openpay (AGREGAR)

```env
OPENPAY_MERCHANT_ID=m5ag0krshs9byhjssp69
OPENPAY_PRIVATE_KEY=sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
OPENPAY_PUBLIC_KEY=pk_1572d7631ef94115901466d396af54d3
OPENPAY_BASE_URL=https://api.openpay.mx/v1
OPENPAY_CLIENT_ID=root@cloudmx.site
```

### Variables de Evolution API (REEMPLAZAR/CORREGIR)

**❌ ELIMINA estas variables incorrectas**:
```
EVOLUTION_API_URL=https://tu-servidor.com
EVOLUTION_API_KEY=tu-key
EVOLUTION_INSTANCE=instancia
```

**✅ AGREGA estas variables correctas**:
```env
EVOLUTION_API_URL=https://evo.whatscloud.site
EVOLUTION_API_TOKEN=AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
EVOLUTION_INSTANCE_NAME=escalafin_prod
```

---

## 🎯 Resumen de Cambios en EasyPanel

| Acción | Variable | Valor |
|--------|----------|-------|
| ✅ Mantener | DATABASE_URL | (tu valor actual) |
| ✅ Mantener | NEXTAUTH_URL | https://escalafin.com |
| ✅ Mantener | NEXTAUTH_SECRET | (tu valor actual) |
| ✅ Mantener | JWT_SECRET | (tu valor actual) |
| ✅ Mantener | NODE_ENV | production |
| ✅ Mantener | PORT | 3000 |
| ➕ Agregar | AWS_BUCKET_NAME | **TU_BUCKET_S3** |
| ➕ Agregar | AWS_FOLDER_PREFIX | uploads/ |
| ➕ Agregar | AWS_REGION | us-east-1 |
| ➕ Agregar | OPENPAY_MERCHANT_ID | m5ag0krshs9byhjssp69 |
| ➕ Agregar | OPENPAY_PRIVATE_KEY | sk_6c14c7d6... |
| ➕ Agregar | OPENPAY_PUBLIC_KEY | pk_1572d763... |
| ➕ Agregar | OPENPAY_BASE_URL | https://api.openpay.mx/v1 |
| ➕ Agregar | OPENPAY_CLIENT_ID | root@cloudmx.site |
| ❌ Eliminar | EVOLUTION_API_KEY | (nombre incorrecto) |
| ❌ Eliminar | EVOLUTION_INSTANCE | (nombre incorrecto) |
| 🔄 Reemplazar | EVOLUTION_API_URL | https://evo.whatscloud.site |
| ➕ Agregar | EVOLUTION_API_TOKEN | AD95FBEE3AAA... |
| ➕ Agregar | EVOLUTION_INSTANCE_NAME | escalafin_prod |

---

## 🔧 Paso a Paso en EasyPanel

### 1. Ve a Environment Variables

En tu aplicación de EasyPanel:
1. Click en tu aplicación "EscalaFin"
2. Ve a la sección **"Environment Variables"**
3. Verás las 9 variables que ya tienes

### 2. Elimina Variables Incorrectas

**Elimina** (click en el ícono de basura 🗑️):
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`

### 3. Corrige Evolution API URL

**Edita** (click en el lápiz ✏️):
- `EVOLUTION_API_URL`
- Cambia de: `https://tu-servidor.com`
- A: `https://evo.whatscloud.site`

### 4. Agrega las Nuevas Variables

Click en **"Add Variable"** y agrega una por una:

#### AWS Variables

```
Nombre: AWS_BUCKET_NAME
Valor: escalafin-prod-storage
```

```
Nombre: AWS_FOLDER_PREFIX
Valor: uploads/
```

```
Nombre: AWS_REGION
Valor: us-east-1
```

**⚠️ IMPORTANTE**: Reemplaza `escalafin-prod-storage` con tu bucket real.

#### Openpay Variables

```
Nombre: OPENPAY_MERCHANT_ID
Valor: m5ag0krshs9byhjssp69
```

```
Nombre: OPENPAY_PRIVATE_KEY
Valor: sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
```

```
Nombre: OPENPAY_PUBLIC_KEY
Valor: pk_1572d7631ef94115901466d396af54d3
```

```
Nombre: OPENPAY_BASE_URL
Valor: https://api.openpay.mx/v1
```

```
Nombre: OPENPAY_CLIENT_ID
Valor: root@cloudmx.site
```

#### Evolution API Variables

```
Nombre: EVOLUTION_API_TOKEN
Valor: AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
```

```
Nombre: EVOLUTION_INSTANCE_NAME
Valor: escalafin_prod
```

### 5. Guarda y Rebuild

1. Click en **"Save"** o **"Apply"**
2. EasyPanel te preguntará si quieres reiniciar
3. Click en **"Restart"** o haz un **"Rebuild"**

---

## ⚠️ CRÍTICO: AWS S3 Bucket

### Si NO Tienes un Bucket de S3

**Opción 1: Crear uno Rápido**

1. Ve a [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click en "Create bucket"
3. Nombre: `escalafin-prod-storage` (o el que prefieras)
4. Región: `us-east-1` (o la más cercana)
5. Configuración: Default (puedes dejar todo por defecto)
6. Click en "Create bucket"

**Opción 2: Usar Almacenamiento Temporal**

Si no puedes configurar S3 inmediatamente, puedes usar valores dummy:

```env
AWS_BUCKET_NAME=placeholder-bucket
AWS_FOLDER_PREFIX=uploads/
AWS_REGION=us-east-1
```

**Pero**: Las funcionalidades de subir documentos **no funcionarán** hasta que configures S3 real.

### Configurar Acceso a S3

EscalaFin necesita credenciales de AWS para acceder a S3. Hay dos formas:

#### Opción A: IAM Credentials (Recomendado)

Agrega estas variables también:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Cómo obtenerlas**:
1. Ve a [IAM Console](https://console.aws.amazon.com/iam/)
2. Crea un usuario con acceso a S3
3. Genera credenciales (Access Key ID y Secret)
4. Agrégalas a EasyPanel

#### Opción B: IAM Role (Si estás en AWS)

Si tu aplicación corre en AWS (EC2, ECS, etc.), puedes usar IAM Roles en lugar de credenciales.

---

## 📊 Total de Variables (Después de los Cambios)

Tendrás **19 variables** en total:

| Categoría | Variables | Total |
|-----------|-----------|-------|
| Base de datos | DATABASE_URL | 1 |
| Autenticación | NEXTAUTH_URL, NEXTAUTH_SECRET, JWT_SECRET | 3 |
| Aplicación | NODE_ENV, PORT | 2 |
| AWS S3 | AWS_BUCKET_NAME, AWS_FOLDER_PREFIX, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY | 5 |
| Openpay | OPENPAY_MERCHANT_ID, OPENPAY_PRIVATE_KEY, OPENPAY_PUBLIC_KEY, OPENPAY_BASE_URL, OPENPAY_CLIENT_ID | 5 |
| Evolution API | EVOLUTION_API_URL, EVOLUTION_API_TOKEN, EVOLUTION_INSTANCE_NAME | 3 |

---

## 🔍 Verificación

Después de agregar todas las variables y reiniciar:

### 1. Verifica Health Check

```bash
curl https://escalafin.com/api/health
```

Debería responder:
```json
{"status": "ok"}
```

### 2. Verifica Logs

En EasyPanel, revisa los logs de la aplicación:

```bash
✅ Server started on port 3000
✅ Connected to database
✅ Openpay configured
✅ AWS S3 configured
✅ Evolution API configured
```

### 3. Prueba la Aplicación

1. Accede a `https://escalafin.com`
2. Inicia sesión
3. Verifica que el dashboard cargue
4. Intenta subir un documento (para verificar S3)
5. Prueba enviar un mensaje de WhatsApp (para verificar Evolution API)

---

## 🐛 Troubleshooting

### Error: "Cannot find bucket"

**Causa**: El bucket de S3 no existe o el nombre es incorrecto

**Solución**: 
1. Verifica en AWS S3 Console que el bucket existe
2. Copia el nombre exacto (case-sensitive)
3. Actualiza `AWS_BUCKET_NAME` en EasyPanel

### Error: "Access Denied" en S3

**Causa**: Faltan credenciales de AWS o no tienen permisos

**Solución**:
1. Agrega `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`
2. Verifica que el usuario IAM tenga permisos de S3

### Error: "Openpay authentication failed"

**Causa**: Credenciales de Openpay incorrectas

**Solución**:
1. Verifica que `OPENPAY_MERCHANT_ID`, `OPENPAY_PRIVATE_KEY` y `OPENPAY_PUBLIC_KEY` sean correctas
2. Verifica que `OPENPAY_BASE_URL` sea la correcta (prod vs sandbox)

### Error: "Evolution API connection failed"

**Causa**: Evolution API no está accesible o el token es incorrecto

**Solución**:
1. Verifica que `https://evo.whatscloud.site` esté accesible
2. Verifica que el token `AD95FBEE3AAA...` sea válido
3. Verifica que la instancia `escalafin_prod` exista en Evolution API

---

## 📋 Checklist Final

Antes de considerar las variables completas:

- [ ] Todas las variables de autenticación (6 variables) ✅
- [ ] Todas las variables de AWS S3 (5 variables) ❌ Pendiente
- [ ] Todas las variables de Openpay (5 variables) ❌ Pendiente
- [ ] Todas las variables de Evolution API (3 variables) ❌ Pendiente
- [ ] Variables incorrectas eliminadas (EVOLUTION_API_KEY, EVOLUTION_INSTANCE)
- [ ] Aplicación reiniciada después de los cambios
- [ ] Health check responde correctamente
- [ ] Logs no muestran errores de configuración

---

## 🚀 Próximos Pasos

### 1. Configura AWS S3 (Si No Lo Tienes)

**Si es urgente**:
- Crea un bucket rápido en AWS S3
- Agrega las credenciales IAM
- Total: 10 minutos

**Si puede esperar**:
- Usa valores placeholder por ahora
- Configura S3 antes de producción real

### 2. Agrega las Variables en EasyPanel

**Tiempo estimado**: 5-7 minutos

Sigue el paso a paso de la sección "Paso a Paso en EasyPanel"

### 3. Rebuild la Aplicación

Después de agregar todas las variables:
- Click en "Restart" o "Rebuild"
- Espera 7-9 minutos
- Monitorea los logs

### 4. Verifica que Todo Funciona

- Health check ✅
- Login ✅
- Dashboard ✅
- Subir documentos ✅
- WhatsApp ✅

---

## 💡 Recomendaciones

### Para Producción

1. **Usa S3 Real**: No uses valores placeholder en producción
2. **Configura Permisos**: IAM roles o credenciales con permisos mínimos necesarios
3. **Usa HTTPS**: Todas las URLs deben ser HTTPS
4. **Backup de Variables**: Guarda una copia de todas las variables en un lugar seguro

### Para Seguridad

1. **No Compartas Credenciales**: Las variables de este documento son sensibles
2. **Rota Secretos**: Cambia los secretos periódicamente
3. **Monitorea Accesos**: Revisa logs de AWS y Openpay regularmente

### Para Testing

Si quieres un ambiente de pruebas:

1. Crea otra aplicación en EasyPanel: "escalafin-staging"
2. Usa Openpay Sandbox: `OPENPAY_BASE_URL=https://sandbox-api.openpay.mx/v1`
3. Usa un bucket de S3 diferente: `escalafin-staging-storage`

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** de EasyPanel
2. **Verifica las variables** están escritas correctamente
3. **Comparte el error específico** para ayuda

---

**¿Necesitas ayuda para configurar alguna de estas variables?**

**¿Ya tienes un bucket de S3 o necesitas crear uno?**

---

**Versión**: 1.0  
**Fecha**: 2025-10-15  
**Estado**: Pendiente configurar AWS S3 + Openpay + Evolution API  
**Prioridad**: 🔴 **ALTA** - Sin estas variables, la aplicación funcionará parcialmente
