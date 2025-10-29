
/**
 * Google Drive Configuration
 * 
 * Este archivo maneja la configuración de Google Drive API
 * 
 * IMPORTANTE: Para obtener las credenciales de Google Cloud:
 * 1. Ve a https://console.cloud.google.com/
 * 2. Crea un nuevo proyecto o selecciona uno existente
 * 3. Habilita la API de Google Drive
 * 4. Crea credenciales OAuth 2.0
 * 5. Descarga el archivo JSON de credenciales
 * 6. Configura las variables de entorno en .env
 */

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

/**
 * Obtiene la configuración de Google Drive desde variables de entorno
 */
export function getGoogleDriveConfig(): GoogleDriveConfig | null {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  // Si no hay credenciales configuradas, retornar null
  if (!clientId || !clientSecret) {
    console.warn('⚠️  Google Drive no configurado. Usando almacenamiento local como fallback.');
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    refreshToken,
  };
}

/**
 * Estructura de carpetas en Google Drive
 * 
 * Estructura recomendada:
 * 
 * 📁 EscalaFin (Carpeta raíz)
 *   ├── 📁 Sistema (Documentos del sistema)
 *   │   ├── 📁 Contratos Plantilla
 *   │   ├── 📁 Documentos Legales
 *   │   ├── 📁 Reportes Sistema
 *   │   └── 📁 Backups
 *   │
 *   └── 📁 Clientes (Documentos por cliente)
 *       ├── 📁 [Cliente ID] - [Nombre Cliente]
 *       │   ├── 📁 Documentos Identidad
 *       │   ├── 📁 Comprobantes Ingresos
 *       │   ├── 📁 Comprobantes Domicilio
 *       │   ├── 📁 Contratos
 *       │   ├── 📁 Pagos
 *       │   └── 📁 Otros
 *       └── ...
 */

export const GOOGLE_DRIVE_FOLDERS = {
  ROOT: 'EscalaFin',
  SYSTEM: {
    name: 'Sistema',
    subfolders: [
      'Contratos Plantilla',
      'Documentos Legales',
      'Reportes Sistema',
      'Backups',
    ],
  },
  CLIENTS: {
    name: 'Clientes',
    subfolders: [
      'Documentos Identidad',
      'Comprobantes Ingresos',
      'Comprobantes Domicilio',
      'Contratos',
      'Pagos',
      'Otros',
    ],
  },
} as const;

/**
 * Tipos de almacenamiento disponibles
 */
export type StorageType = 'google-drive' | 'local';

/**
 * Obtiene el tipo de almacenamiento actual
 */
export function getStorageType(): StorageType {
  const config = getGoogleDriveConfig();
  
  // Si hay configuración de Google Drive y refresh token, usar Google Drive
  if (config && config.refreshToken) {
    return 'google-drive';
  }
  
  // Por defecto, usar almacenamiento local
  return 'local';
}

/**
 * Verifica si Google Drive está configurado y listo para usar
 */
export function isGoogleDriveReady(): boolean {
  const config = getGoogleDriveConfig();
  return !!(config && config.refreshToken);
}
