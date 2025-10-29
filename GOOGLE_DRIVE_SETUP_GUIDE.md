# Guía de Configuración: Google Drive API

## Requisitos Previos
- Cuenta de Google (Gmail)
- Acceso a Google Cloud Console

## Paso 1: Crear Proyecto en Google Cloud Console

1. Accede a Google Cloud Console: https://console.cloud.google.com/
2. Click en el selector de proyectos (arriba a la izquierda)
3. Click en "Nuevo Proyecto"
4. Nombre: EscalaFin
5. Click en "Crear"

## Paso 2: Habilitar Google Drive API

1. En el menú lateral, ve a: APIs y servicios > Biblioteca
2. Busca: "Google Drive API"
3. Click en "Google Drive API"
4. Click en "HABILITAR"

## Paso 3: Crear Credenciales OAuth 2.0

1. Ve a: APIs y servicios > Credenciales
2. Click en "CONFIGURAR PANTALLA DE CONSENTIMIENTO"
3. Selecciona: Externo
4. Información de la aplicación: Nombre: EscalaFin
5. Agregar ámbitos:
   - https://www.googleapis.com/auth/drive.file
   - https://www.googleapis.com/auth/drive
6. Crear credenciales OAuth 2.0:
   - Tipo: Aplicación web
   - URIs autorizados: http://localhost:3000, https://demo.escalafin.com
   - URIs de redirección: 
     * http://localhost:3000/api/auth/google/callback
     * https://demo.escalafin.com/api/auth/google/callback

## Paso 4: Configurar Variables de Entorno

En EasyPanel, añade estas variables:

```
GOOGLE_DRIVE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=tu-client-secret
GOOGLE_DRIVE_REDIRECT_URI=https://demo.escalafin.com/api/auth/google/callback
GOOGLE_DRIVE_REFRESH_TOKEN=tu-refresh-token
STORAGE_TYPE=google-drive
LOCAL_STORAGE_PATH=/app/uploads
```

## Recursos
- Google Drive API: https://developers.google.com/drive/api/v3/about-sdk
- Google Cloud Console: https://console.cloud.google.com/

