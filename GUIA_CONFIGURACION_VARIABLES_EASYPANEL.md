
# 🔧 Guía Paso a Paso - Configurar Variables en EasyPanel

## 📊 Resumen Rápido

Necesitas **agregar 11 variables** y **corregir 3 variables** en EasyPanel.

**Tiempo estimado**: 5-10 minutos

---

## 🎯 Objetivo

Configurar todas las variables de entorno necesarias para que EscalaFin funcione completamente:

- ✅ Base de datos y autenticación (ya configuradas)
- ➕ AWS S3 para archivos (3 variables a agregar)
- ➕ Openpay para pagos (5 variables a agregar)
- 🔄 Evolution API para WhatsApp (3 variables a corregir)

---

## 📋 Paso a Paso

### Paso 1: Acceder a EasyPanel

1. Ve a tu panel de EasyPanel
2. Inicia sesión
3. Navega a tu aplicación **"EscalaFin"** o como la hayas nombrado

### Paso 2: Ir a Environment Variables

1. En el menú lateral, busca **"Environment"** o **"Environment Variables"**
2. Click para abrir la sección de variables
3. Verás las 9 variables que ya tienes configuradas

### Paso 3: ELIMINAR Variables Incorrectas

**⚠️ IMPORTANTE**: Primero elimina estas variables incorrectas

| Variable a Eliminar | Razón |
|---------------------|-------|
| `EVOLUTION_API_KEY` | El código usa `EVOLUTION_API_TOKEN` |
| `EVOLUTION_INSTANCE` | El código usa `EVOLUTION_INSTANCE_NAME` |

**Cómo eliminar**:
1. Busca cada variable en la lista
2. Click en el ícono de **basura** 🗑️ o **"Delete"**
3. Confirma la eliminación

### Paso 4: CORREGIR Evolution API URL

**Edita esta variable**:

| Variable | Valor Actual (Incorrecto) | Nuevo Valor (Correcto) |
|----------|---------------------------|------------------------|
| `EVOLUTION_API_URL` | `https://tu-servidor.com` | `https://evo.whatscloud.site` |

**Cómo editar**:
1. Busca `EVOLUTION_API_URL`
2. Click en el ícono de **lápiz** ✏️ o **"Edit"**
3. Reemplaza el valor con: `https://evo.whatscloud.site`
4. Click en **"Save"** o **"Update"**

### Paso 5: AGREGAR Variables de AWS S3

Click en **"Add Variable"** o **"+ New"** y agrega una por una:

#### Variable 1: AWS_BUCKET_NAME

```
Name: AWS_BUCKET_NAME
Value: escalafin-prod-storage
```

**⚠️ IMPORTANTE**: Si tienes tu propio bucket de S3, usa ese nombre aquí.

#### Variable 2: AWS_FOLDER_PREFIX

```
Name: AWS_FOLDER_PREFIX
Value: uploads/
```

#### Variable 3: AWS_REGION

```
Name: AWS_REGION
Value: us-east-1
```

**Nota**: Si tu bucket está en otra región (por ejemplo, `us-west-2`), usa esa región.

#### Variables 4 y 5: Credenciales de AWS (OPCIONALES por ahora)

```
Name: AWS_ACCESS_KEY_ID
Value: [Tu Access Key ID de AWS IAM]
```

```
Name: AWS_SECRET_ACCESS_KEY
Value: [Tu Secret Access Key de AWS IAM]
```

**¿Cómo obtenerlas?**
1. Ve a [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Crea un usuario con permisos de S3
3. Genera credenciales (Access Key)
4. Copia y pega aquí

**¿Son necesarias ahora?**
- Si tu servidor corre en AWS (EC2, ECS, etc.) y tiene un IAM Role, **NO son necesarias**
- Si tu servidor NO está en AWS o no tiene IAM Role, **SÍ son necesarias**
- Si no estás seguro, **agrégalas para estar seguro**

### Paso 6: AGREGAR Variables de Openpay

Click en **"Add Variable"** y agrega estas 5 variables:

#### Variable 1: OPENPAY_MERCHANT_ID

```
Name: OPENPAY_MERCHANT_ID
Value: m5ag0krshs9byhjssp69
```

#### Variable 2: OPENPAY_PRIVATE_KEY

```
Name: OPENPAY_PRIVATE_KEY
Value: sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
```

#### Variable 3: OPENPAY_PUBLIC_KEY

```
Name: OPENPAY_PUBLIC_KEY
Value: pk_1572d7631ef94115901466d396af54d3
```

#### Variable 4: OPENPAY_BASE_URL

```
Name: OPENPAY_BASE_URL
Value: https://api.openpay.mx/v1
```

**Nota**: Si quieres usar el sandbox de Openpay para pruebas, usa:
```
Value: https://sandbox-api.openpay.mx/v1
```

#### Variable 5: OPENPAY_CLIENT_ID

```
Name: OPENPAY_CLIENT_ID
Value: root@cloudmx.site
```

### Paso 7: AGREGAR Variables de Evolution API

Click en **"Add Variable"** y agrega estas 2 variables:

#### Variable 1: EVOLUTION_API_TOKEN

```
Name: EVOLUTION_API_TOKEN
Value: AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
```

**Nota**: Esta reemplaza la variable incorrecta `EVOLUTION_API_KEY`

#### Variable 2: EVOLUTION_INSTANCE_NAME

```
Name: EVOLUTION_INSTANCE_NAME
Value: escalafin_prod
```

**Nota**: Esta reemplaza la variable incorrecta `EVOLUTION_INSTANCE`

### Paso 8: Verificar Todas las Variables

Después de todos los cambios, deberías tener **17 variables** (o 19 si agregaste las credenciales de AWS):

#### Categoría 1: Base de Datos y Auth (6 variables) ✅
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`

#### Categoría 2: AWS S3 (3 o 5 variables) ✅
- `AWS_BUCKET_NAME`
- `AWS_FOLDER_PREFIX`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID` (opcional)
- `AWS_SECRET_ACCESS_KEY` (opcional)

#### Categoría 3: Openpay (5 variables) ✅
- `OPENPAY_MERCHANT_ID`
- `OPENPAY_PRIVATE_KEY`
- `OPENPAY_PUBLIC_KEY`
- `OPENPAY_BASE_URL`
- `OPENPAY_CLIENT_ID`

#### Categoría 4: Evolution API (3 variables) ✅
- `EVOLUTION_API_URL` (corregida)
- `EVOLUTION_API_TOKEN` (nueva)
- `EVOLUTION_INSTANCE_NAME` (nueva)

### Paso 9: Guardar y Reiniciar

1. **Guarda todos los cambios**
   - Busca el botón **"Save"**, **"Apply"** o **"Save Changes"**
   - Click para guardar

2. **Reinicia la aplicación**
   - EasyPanel te preguntará si quieres reiniciar
   - Click en **"Restart"** o **"Rebuild"**
   - Espera 7-9 minutos

3. **Monitorea los logs**
   - Mantén abierta la vista de logs
   - Busca mensajes de error relacionados con las variables

---

## 🔍 Verificación

### Verifica que las Variables se Aplicaron

En los logs, deberías ver:

```bash
✅ Server started on port 3000
✅ Connected to database
✅ AWS S3 configured for bucket: escalafin-prod-storage
✅ Openpay configured for merchant: m5ag0krshs9byhjssp69
✅ Evolution API configured for instance: escalafin_prod
```

### Verifica la Aplicación

1. **Health Check**:
   ```bash
   curl https://escalafin.com/api/health
   ```
   Debería responder: `{"status": "ok"}`

2. **Login**:
   - Accede a `https://escalafin.com`
   - Inicia sesión con tus credenciales
   - Verifica que el dashboard cargue

3. **Funcionalidades**:
   - **Subir archivo**: Prueba subir un documento (verifica S3)
   - **Crear préstamo**: Prueba crear un préstamo (verifica Openpay)
   - **Enviar WhatsApp**: Prueba enviar un mensaje (verifica Evolution API)

---

## 🐛 Troubleshooting

### Error: "Cannot find AWS bucket"

**Síntoma**: En los logs ves "Error: The specified bucket does not exist"

**Causa**: El bucket `escalafin-prod-storage` no existe en tu cuenta de AWS

**Solución**:
1. Ve a [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Verifica que el bucket existe
3. Si no existe, créalo:
   - Click "Create bucket"
   - Nombre: `escalafin-prod-storage` (o el que prefieras)
   - Región: `us-east-1`
   - Click "Create bucket"
4. Actualiza `AWS_BUCKET_NAME` en EasyPanel si usas otro nombre
5. Reinicia la aplicación

### Error: "AWS credentials not found"

**Síntoma**: En los logs ves "Error: Missing credentials in config"

**Causa**: Faltan `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`

**Solución**:
1. Ve a [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Crea un usuario con permisos de S3:
   - Users → Add users
   - Nombre: `escalafin-s3-user`
   - Access type: Programmatic access
   - Permissions: AmazonS3FullAccess (o crea una policy más restrictiva)
3. Copia Access Key ID y Secret Access Key
4. Agrégalas a EasyPanel
5. Reinicia la aplicación

### Error: "Openpay authentication failed"

**Síntoma**: En los logs ves "Error: Invalid API keys"

**Causa**: Las credenciales de Openpay son incorrectas o están en el ambiente equivocado

**Solución**:
1. Verifica que `OPENPAY_MERCHANT_ID`, `OPENPAY_PRIVATE_KEY` y `OPENPAY_PUBLIC_KEY` sean correctas
2. Verifica que `OPENPAY_BASE_URL` corresponda al ambiente:
   - Producción: `https://api.openpay.mx/v1`
   - Sandbox: `https://sandbox-api.openpay.mx/v1`
3. Si usas sandbox, asegúrate de usar las keys de sandbox
4. Si usas producción, asegúrate de usar las keys de producción
5. Reinicia la aplicación

### Error: "Evolution API connection refused"

**Síntoma**: En los logs ves "Error: connect ECONNREFUSED" o "Error: getaddrinfo ENOTFOUND"

**Causa**: Evolution API no está accesible o la URL es incorrecta

**Solución**:
1. Verifica que `EVOLUTION_API_URL` sea `https://evo.whatscloud.site`
2. Prueba acceder manualmente:
   ```bash
   curl https://evo.whatscloud.site
   ```
3. Si no responde, verifica:
   - ¿El servidor de Evolution API está corriendo?
   - ¿Hay un firewall bloqueando el acceso?
   - ¿La URL es correcta?
4. Contacta al administrador del servidor de Evolution API
5. Reinicia la aplicación una vez resuelto

### Error: "Evolution API unauthorized"

**Síntoma**: En los logs ves "Error: 401 Unauthorized" o "Error: Invalid token"

**Causa**: El token `EVOLUTION_API_TOKEN` es incorrecto o expiró

**Solución**:
1. Verifica que `EVOLUTION_API_TOKEN` sea `AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77`
2. Si cambió, obtén el token actualizado del panel de Evolution API
3. Actualiza `EVOLUTION_API_TOKEN` en EasyPanel
4. Reinicia la aplicación

### Error: "Evolution instance not found"

**Síntoma**: En los logs ves "Error: Instance 'escalafin_prod' not found"

**Causa**: La instancia de WhatsApp no existe en Evolution API

**Solución**:
1. Accede al panel de Evolution API
2. Verifica que la instancia `escalafin_prod` existe
3. Si no existe, créala:
   - En el panel de Evolution API, crea una nueva instancia
   - Usa el nombre `escalafin_prod`
   - Completa la configuración y empareja con WhatsApp
4. Si usas otro nombre, actualiza `EVOLUTION_INSTANCE_NAME` en EasyPanel
5. Reinicia la aplicación

---

## 📊 Checklist de Variables

Marca cada variable después de agregarla:

### Variables Ya Configuradas ✅
- [x] DATABASE_URL
- [x] NEXTAUTH_URL
- [x] NEXTAUTH_SECRET
- [x] JWT_SECRET
- [x] NODE_ENV
- [x] PORT

### Variables de AWS S3 (Agregar)
- [ ] AWS_BUCKET_NAME
- [ ] AWS_FOLDER_PREFIX
- [ ] AWS_REGION
- [ ] AWS_ACCESS_KEY_ID (si es necesario)
- [ ] AWS_SECRET_ACCESS_KEY (si es necesario)

### Variables de Openpay (Agregar)
- [ ] OPENPAY_MERCHANT_ID
- [ ] OPENPAY_PRIVATE_KEY
- [ ] OPENPAY_PUBLIC_KEY
- [ ] OPENPAY_BASE_URL
- [ ] OPENPAY_CLIENT_ID

### Variables de Evolution API (Corregir/Agregar)
- [ ] EVOLUTION_API_URL (corregir valor)
- [ ] EVOLUTION_API_TOKEN (agregar nueva)
- [ ] EVOLUTION_INSTANCE_NAME (agregar nueva)
- [ ] EVOLUTION_API_KEY (eliminar - nombre incorrecto)
- [ ] EVOLUTION_INSTANCE (eliminar - nombre incorrecto)

### Después de Configurar
- [ ] Todos los cambios guardados
- [ ] Aplicación reiniciada/rebuildeada
- [ ] Logs revisados (sin errores de variables)
- [ ] Health check responde correctamente
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Funcionalidades principales operan

---

## 💡 Tips

### Para Copiar y Pegar Rápido

He creado un archivo de referencia: **`VARIABLES_REFERENCIA_EASYPANEL.txt`**

Puedes abrirlo y copiar cada variable con su valor directamente.

### Para No Equivocarte

1. **Copia y pega**: No escribas las variables manualmente
2. **Verifica typos**: Un solo carácter incorrecto causará errores
3. **Respeta mayúsculas/minúsculas**: `AWS_BUCKET_NAME` ≠ `aws_bucket_name`
4. **No agregues espacios**: `Value: m5ag0k` ≠ `Value: m5ag0k `

### Para Probar Gradualmente

Si quieres probar por partes:

1. **Primero**: Agrega solo variables de AWS S3
2. **Reinicia** y verifica que funcione la subida de archivos
3. **Segundo**: Agrega variables de Openpay
4. **Reinicia** y verifica que funcione el procesamiento de pagos
5. **Tercero**: Corrige variables de Evolution API
6. **Reinicia** y verifica que funcionen los mensajes de WhatsApp

---

## 🚀 Próximo Paso

Después de configurar todas las variables:

1. **Haz el Rebuild** con el Dockerfile v9.4
2. **Monitorea los logs** para verificar que no haya errores
3. **Prueba todas las funcionalidades**
4. **¡Disfruta de EscalaFin en producción!** 🎉

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Copia el error exacto** de los logs
2. **Indica qué variable** estás intentando configurar
3. **Comparte el mensaje de error** completo

---

**¿Listo para empezar? Ve al Paso 1 y comienza a configurar las variables.** 🚀

---

**Versión**: 1.0  
**Tiempo estimado**: 5-10 minutos  
**Dificultad**: 🟢 Fácil (copiar y pegar)  
**Prioridad**: 🔴 **ALTA** - Sin estas variables, la aplicación funcionará parcialmente
