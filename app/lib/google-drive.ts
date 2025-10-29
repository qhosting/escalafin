
/**
 * Google Drive Service
 * 
 * Este servicio maneja todas las operaciones con Google Drive API
 */

import { google } from 'googleapis';
import { getGoogleDriveConfig, GOOGLE_DRIVE_FOLDERS } from './google-drive-config';

/**
 * Crea un cliente OAuth2 autenticado
 */
function createOAuth2Client() {
  const config = getGoogleDriveConfig();
  
  if (!config) {
    throw new Error('Google Drive no está configurado');
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  return oauth2Client;
}

/**
 * Crea un cliente de Google Drive autenticado
 */
function createDriveClient() {
  const auth = createOAuth2Client();
  return google.drive({ version: 'v3', auth });
}

/**
 * Busca o crea una carpeta en Google Drive
 */
export async function findOrCreateFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const drive = createDriveClient();

  // Buscar si la carpeta ya existe
  const query = parentFolderId
    ? `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  // Si existe, devolver su ID
  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Si no existe, crearla
  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id!;
}

/**
 * Inicializa la estructura de carpetas en Google Drive
 */
export async function initializeFolderStructure(): Promise<{
  rootId: string;
  systemId: string;
  clientsId: string;
}> {
  try {
    // Crear carpeta raíz
    const rootId = await findOrCreateFolder(GOOGLE_DRIVE_FOLDERS.ROOT);

    // Crear carpeta Sistema
    const systemId = await findOrCreateFolder(
      GOOGLE_DRIVE_FOLDERS.SYSTEM.name,
      rootId
    );

    // Crear subcarpetas del sistema
    for (const subfolder of GOOGLE_DRIVE_FOLDERS.SYSTEM.subfolders) {
      await findOrCreateFolder(subfolder, systemId);
    }

    // Crear carpeta Clientes
    const clientsId = await findOrCreateFolder(
      GOOGLE_DRIVE_FOLDERS.CLIENTS.name,
      rootId
    );

    return { rootId, systemId, clientsId };
  } catch (error) {
    console.error('Error al inicializar estructura de carpetas:', error);
    throw error;
  }
}

/**
 * Crea una carpeta para un cliente específico
 */
export async function createClientFolder(
  clientId: string,
  clientName: string
): Promise<string> {
  try {
    // Obtener el ID de la carpeta de Clientes
    const { clientsId } = await initializeFolderStructure();

    // Crear carpeta del cliente
    const folderName = `${clientId} - ${clientName}`;
    const clientFolderId = await findOrCreateFolder(folderName, clientsId);

    // Crear subcarpetas del cliente
    for (const subfolder of GOOGLE_DRIVE_FOLDERS.CLIENTS.subfolders) {
      await findOrCreateFolder(subfolder, clientFolderId);
    }

    return clientFolderId;
  } catch (error) {
    console.error('Error al crear carpeta del cliente:', error);
    throw error;
  }
}

/**
 * Sube un archivo a Google Drive
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{
  fileId: string;
  webViewLink: string;
  webContentLink: string;
}> {
  try {
    const drive = createDriveClient();
    const { Readable } = require('stream');

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink!,
      webContentLink: response.data.webContentLink!,
    };
  } catch (error) {
    console.error('Error al subir archivo a Google Drive:', error);
    throw error;
  }
}

/**
 * Descarga un archivo de Google Drive
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
  try {
    const drive = createDriveClient();

    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error('Error al descargar archivo de Google Drive:', error);
    throw error;
  }
}

/**
 * Elimina un archivo de Google Drive
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const drive = createDriveClient();
    await drive.files.delete({ fileId });
  } catch (error) {
    console.error('Error al eliminar archivo de Google Drive:', error);
    throw error;
  }
}

/**
 * Lista archivos en una carpeta
 */
export async function listFiles(folderId: string): Promise<
  Array<{
    id: string;
    name: string;
    mimeType: string;
    size: string;
    createdTime: string;
    webViewLink: string;
  }>
> {
  try {
    const drive = createDriveClient();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
      orderBy: 'createdTime desc',
    });

    return (response.data.files || []) as any[];
  } catch (error) {
    console.error('Error al listar archivos de Google Drive:', error);
    throw error;
  }
}

/**
 * Genera una URL pública para compartir un archivo
 */
export async function shareFile(fileId: string): Promise<string> {
  try {
    const drive = createDriveClient();

    // Hacer el archivo accesible para cualquiera con el link
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Obtener el link público
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink',
    });

    return file.data.webViewLink!;
  } catch (error) {
    console.error('Error al compartir archivo de Google Drive:', error);
    throw error;
  }
}
