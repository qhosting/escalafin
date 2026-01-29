# ☁️ Guía de Configuración: Backup Automático a Google Drive

Este documento explica cómo obtener las credenciales necesarias para activar el sistema de backup automático.

## 1. Crear Proyecto y Service Account en Google Cloud

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un nuevo proyecto o selecciona uno existente.
3.  En el menú lateral, ve a **APIs & Services** > **Library**.
4.  Busca **Google Drive API** y habilítala.
5.  Ve a **APIs & Services** > **Credentials**.
6.  Haz clic en **Create Credentials** > **Service Account**.
7.  Asigna un nombre (ej. `backup-service`) y crea la cuenta.
8.  Una vez creada, entra en la Service Account, ve a la pestaña **Keys** > **Add Key** > **Create new key** > **JSON**.
9.  Se descargará un archivo `.json`. **Este es el valor de `GOOGLE_SERVICE_ACCOUNT_JSON`**.

## 2. Obtener el ID de la Carpeta en Drive

1.  Crea una carpeta en tu Google Drive donde quieras guardar los backups.
2.  Abre la carpeta y mira la URL.
3.  El ID es la cadena alfanumérica al final: `drive.google.com/drive/folders/ESTE_ES_EL_ID`.
4.  **Importante**: Debes **compartir** esta carpeta con el email de la Service Account (que aparece en el JSON descargado, campo `client_email`) dándole permisos de **Editor**.

## 3. Configurar Variables de Entorno

En tu panel de EasyPanel o archivo `.env`:

```env
# Conexiones a Bases de Datos
DATABASE_URL="postgresql://user:pass@host:5432/db"
MONGO_URI="mongodb://user:pass@host:27017/db"

# Google Drive Backup
GOOGLE_DRIVE_FOLDER_ID="tu_folder_id"
GOOGLE_SERVICE_ACCOUNT_JSON='{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}'
```

> **Nota**: Para `GOOGLE_SERVICE_ACCOUNT_JSON`, asegúrate de copiar todo el contenido del archivo JSON como una sola línea o en formato string válido.

## 4. Funcionamiento

*   El sistema ejecutará automáticamente el backup todos los días a las **3:00 AM**.
*   Los archivos generados son `.zip` conteniendo dumps de PostgreSQL y MongoDB.
*   Los archivos se borran del servidor local inmediatamente después de subirse a Drive.
