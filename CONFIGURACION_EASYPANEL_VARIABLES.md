
# Configuración de Variables de Entorno - EasyPanel

## Variables Críticas (REQUERIDAS)

### Base de Datos
```bash
DATABASE_URL=postgresql://usuario:password@host:5432/escalafin_db
```

### Autenticación NextAuth
```bash
NEXTAUTH_SECRET=tu_clave_secreta_muy_segura_de_minimo_32_caracteres
NEXTAUTH_URL=https://escalafin-escalafin-mvp.vnap16.easypanel.host
NEXTAUTH_DEBUG=false
```

### Configuración General
```bash
NODE_ENV=production
```

## Variables Opcionales (Para funcionalidades específicas)

### Almacenamiento de Archivos
```bash
STORAGE_TYPE=local
LOCAL_UPLOAD_DIR=/app/uploads
LOCAL_BASE_URL=/api/files
LOCAL_MAX_FILE_SIZE=10
```

### AWS S3 (Solo si quieres usar almacenamiento en la nube)
```bash
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_BUCKET_NAME=escalafin-uploads
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=escalafin-mvp/
```

### Openpay (Para pagos)
```bash
OPENPAY_MERCHANT_ID=m5ag0krshs9byhjssp69
OPENPAY_PRIVATE_KEY=sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
OPENPAY_PUBLIC_KEY=pk_1572d7631ef94115901466d396af54d3
OPENPAY_BASE_URL=https://sandbox-api.openpay.mx/v1
```

### WhatsApp EvolutionAPI
```bash
EVOLUTION_API_URL=https://evo.whatscloud.site
EVOLUTION_API_TOKEN=AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
EVOLUTION_INSTANCE_NAME=escalafin
```

## Pasos para Configurar en EasyPanel

1. Ve al panel de tu aplicación en EasyPanel
2. Busca la sección "Environment Variables" o "Variables de Entorno"
3. Agrega cada variable una por una
4. Guarda los cambios
5. Redeploya la aplicación

## Generación de NEXTAUTH_SECRET

Puedes generar una clave segura usando:
```bash
openssl rand -base64 32
```

O usar este ejemplo (CÁMBIALO):
```bash
NEXTAUTH_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz123456789
```
