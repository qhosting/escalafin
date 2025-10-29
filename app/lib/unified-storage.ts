
/**
 * Unified Storage Service
 * 
 * Este servicio unifica Google Drive y almacenamiento local,
 * seleccionando automáticamente el mejor método disponible
 */

import { getStorageType, isGoogleDriveReady } from './google-drive-config';
import * as GoogleDrive from './google-drive';
import * as LocalStorage from './local-storage';

/**
 * Tipo de respuesta al subir un archivo
 */
export interface UploadResult {
  success: boolean;
  storage: 'google-drive' | 'local';
  path: string; // Google Drive fileId o ruta local
  url?: string; // URL pública (solo Google Drive)
  error?: string;
}

/**
 * Inicializa el sistema de almacenamiento
 */
export async function initializeStorage(): Promise<void> {
  const storageType = getStorageType();

  if (storageType === 'google-drive' && isGoogleDriveReady()) {
    try {
      await GoogleDrive.initializeFolderStructure();
      console.log('✅ Google Drive inicializado correctamente');
    } catch (error) {
      console.warn('⚠️  Error al inicializar Google Drive, usando almacenamiento local');
      await LocalStorage.initializeLocalFolderStructure();
    }
  } else {
    await LocalStorage.initializeLocalFolderStructure();
    console.log('✅ Almacenamiento local inicializado correctamente');
  }
}

/**
 * Crea una carpeta para un cliente
 */
export async function createClientFolder(
  clientId: string,
  clientName: string
): Promise<string> {
  const storageType = getStorageType();

  if (storageType === 'google-drive' && isGoogleDriveReady()) {
    try {
      return await GoogleDrive.createClientFolder(clientId, clientName);
    } catch (error) {
      console.warn('⚠️  Error en Google Drive, usando almacenamiento local');
      return await LocalStorage.createLocalClientFolder(clientId, clientName);
    }
  } else {
    return await LocalStorage.createLocalClientFolder(clientId, clientName);
  }
}

/**
 * Sube un archivo (automáticamente selecciona Google Drive o local)
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  options: {
    clientId?: string;
    clientName?: string;
    subfolder?: string;
    isSystem?: boolean;
  }
): Promise<UploadResult> {
  const storageType = getStorageType();

  try {
    // Intentar subir a Google Drive
    if (storageType === 'google-drive' && isGoogleDriveReady()) {
      let folderId: string;

      if (options.isSystem) {
        const { systemId } = await GoogleDrive.initializeFolderStructure();
        folderId = systemId;
      } else if (options.clientId && options.clientName) {
        folderId = await GoogleDrive.createClientFolder(
          options.clientId,
          options.clientName
        );
      } else {
        throw new Error('Se requiere clientId y clientName o isSystem=true');
      }

      if (options.subfolder) {
        folderId = await GoogleDrive.findOrCreateFolder(
          options.subfolder,
          folderId
        );
      }

      const result = await GoogleDrive.uploadFile(
        buffer,
        fileName,
        mimeType,
        folderId
      );

      return {
        success: true,
        storage: 'google-drive',
        path: result.fileId,
        url: result.webViewLink,
      };
    }

    // Fallback: usar almacenamiento local
    let folderPath: string;

    if (options.isSystem) {
      folderPath = LocalStorage.getSystemFolderPath(options.subfolder);
    } else if (options.clientId && options.clientName) {
      folderPath = LocalStorage.getClientFolderPath(
        options.clientId,
        options.clientName,
        options.subfolder
      );
    } else {
      throw new Error('Se requiere clientId y clientName o isSystem=true');
    }

    const filePath = await LocalStorage.saveFileLocally(
      buffer,
      fileName,
      folderPath
    );

    return {
      success: true,
      storage: 'local',
      path: filePath,
    };
  } catch (error: any) {
    console.error('Error al subir archivo:', error);
    return {
      success: false,
      storage: storageType,
      path: '',
      error: error.message,
    };
  }
}

/**
 * Descarga un archivo
 */
export async function downloadFile(
  filePath: string,
  storageType: 'google-drive' | 'local'
): Promise<Buffer> {
  if (storageType === 'google-drive') {
    return await GoogleDrive.downloadFile(filePath);
  } else {
    return await LocalStorage.readFileLocally(filePath);
  }
}

/**
 * Elimina un archivo
 */
export async function deleteFile(
  filePath: string,
  storageType: 'google-drive' | 'local'
): Promise<void> {
  if (storageType === 'google-drive') {
    await GoogleDrive.deleteFile(filePath);
  } else {
    await LocalStorage.deleteFileLocally(filePath);
  }
}

/**
 * Obtiene información sobre el tipo de almacenamiento actual
 */
export function getStorageInfo(): {
  type: 'google-drive' | 'local';
  ready: boolean;
  message: string;
} {
  const storageType = getStorageType();
  const isReady = storageType === 'google-drive' ? isGoogleDriveReady() : true;

  let message = '';
  if (storageType === 'google-drive') {
    message = isReady
      ? 'Google Drive configurado y listo'
      : 'Google Drive no configurado. Configurar credenciales para habilitar.';
  } else {
    message = 'Usando almacenamiento local en el servidor';
  }

  return {
    type: storageType,
    ready: isReady,
    message,
  };
}
