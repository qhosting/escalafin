
/**
 * Local Storage Service
 * 
 * Este servicio maneja el almacenamiento local de archivos en el servidor
 * como alternativa a Google Drive
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Directorio base para almacenamiento local
 */
const STORAGE_BASE_DIR = process.env.LOCAL_STORAGE_PATH || '/app/uploads';

/**
 * Estructura de carpetas local (similar a Google Drive)
 */
const LOCAL_FOLDERS = {
  ROOT: 'escalafin',
  SYSTEM: 'sistema',
  CLIENTS: 'clientes',
  SYSTEM_SUBFOLDERS: [
    'contratos-plantilla',
    'documentos-legales',
    'reportes-sistema',
    'backups',
  ],
  CLIENT_SUBFOLDERS: [
    'documentos-identidad',
    'comprobantes-ingresos',
    'comprobantes-domicilio',
    'contratos',
    'pagos',
    'otros',
  ],
};

/**
 * Inicializa la estructura de carpetas locales
 */
export async function initializeLocalFolderStructure(): Promise<void> {
  try {
    // Crear carpeta raíz
    const rootPath = path.join(STORAGE_BASE_DIR, LOCAL_FOLDERS.ROOT);
    await ensureDir(rootPath);

    // Crear carpeta Sistema
    const systemPath = path.join(rootPath, LOCAL_FOLDERS.SYSTEM);
    await ensureDir(systemPath);

    // Crear subcarpetas del sistema
    for (const subfolder of LOCAL_FOLDERS.SYSTEM_SUBFOLDERS) {
      await ensureDir(path.join(systemPath, subfolder));
    }

    // Crear carpeta Clientes
    const clientsPath = path.join(rootPath, LOCAL_FOLDERS.CLIENTS);
    await ensureDir(clientsPath);

    console.log('✅ Estructura de carpetas locales inicializada');
  } catch (error) {
    console.error('Error al inicializar estructura de carpetas locales:', error);
    throw error;
  }
}

/**
 * Asegura que un directorio existe, créalo si no
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Crea una carpeta para un cliente específico
 */
export async function createLocalClientFolder(
  clientId: string,
  clientName: string
): Promise<string> {
  try {
    const rootPath = path.join(STORAGE_BASE_DIR, LOCAL_FOLDERS.ROOT);
    const clientsPath = path.join(rootPath, LOCAL_FOLDERS.CLIENTS);

    // Crear carpeta del cliente
    const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, '-');
    const folderName = `${clientId}-${sanitizedName}`;
    const clientFolderPath = path.join(clientsPath, folderName);
    await ensureDir(clientFolderPath);

    // Crear subcarpetas del cliente
    for (const subfolder of LOCAL_FOLDERS.CLIENT_SUBFOLDERS) {
      await ensureDir(path.join(clientFolderPath, subfolder));
    }

    return clientFolderPath;
  } catch (error) {
    console.error('Error al crear carpeta local del cliente:', error);
    throw error;
  }
}

/**
 * Guarda un archivo localmente
 */
export async function saveFileLocally(
  buffer: Buffer,
  fileName: string,
  folderPath: string
): Promise<string> {
  try {
    await ensureDir(folderPath);
    
    const filePath = path.join(folderPath, fileName);
    await fs.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    console.error('Error al guardar archivo localmente:', error);
    throw error;
  }
}

/**
 * Lee un archivo local
 */
export async function readFileLocally(filePath: string): Promise<Buffer> {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    console.error('Error al leer archivo local:', error);
    throw error;
  }
}

/**
 * Elimina un archivo local
 */
export async function deleteFileLocally(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error al eliminar archivo local:', error);
    throw error;
  }
}

/**
 * Lista archivos en una carpeta local
 */
export async function listLocalFiles(folderPath: string): Promise<
  Array<{
    name: string;
    path: string;
    size: number;
    createdTime: Date;
  }>
> {
  try {
    if (!existsSync(folderPath)) {
      return [];
    }

    const files = await fs.readdir(folderPath);
    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(folderPath, file);
        const stats = await fs.stat(filePath);

        return {
          name: file,
          path: filePath,
          size: stats.size,
          createdTime: stats.birthtime,
        };
      })
    );

    return fileDetails.sort((a, b) => 
      b.createdTime.getTime() - a.createdTime.getTime()
    );
  } catch (error) {
    console.error('Error al listar archivos locales:', error);
    throw error;
  }
}

/**
 * Obtiene la ruta para archivos del sistema
 */
export function getSystemFolderPath(subfolder?: string): string {
  const rootPath = path.join(STORAGE_BASE_DIR, LOCAL_FOLDERS.ROOT);
  const systemPath = path.join(rootPath, LOCAL_FOLDERS.SYSTEM);
  
  if (subfolder) {
    return path.join(systemPath, subfolder);
  }
  
  return systemPath;
}

/**
 * Obtiene la ruta para archivos de un cliente
 */
export function getClientFolderPath(
  clientId: string,
  clientName: string,
  subfolder?: string
): string {
  const rootPath = path.join(STORAGE_BASE_DIR, LOCAL_FOLDERS.ROOT);
  const clientsPath = path.join(rootPath, LOCAL_FOLDERS.CLIENTS);
  
  const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, '-');
  const folderName = `${clientId}-${sanitizedName}`;
  const clientPath = path.join(clientsPath, folderName);
  
  if (subfolder) {
    return path.join(clientPath, subfolder);
  }
  
  return clientPath;
}
