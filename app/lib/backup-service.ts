
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver';
import { google } from 'googleapis';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Definir rutas
const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function performBackup() {
  console.log('🚀 Iniciando proceso de backup...');

  // Crear directorio de backups si no existe
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pgDumpFile = path.join(BACKUP_DIR, `pg_dump_${timestamp}.sql`);
  const mongoDumpDir = path.join(BACKUP_DIR, `mongo_dump_${timestamp}`);
  const zipFile = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);

  try {
    // 1. PostgreSQL Backup
    if (process.env.DATABASE_URL) {
      console.log('📦 Realizando backup de PostgreSQL...');
      // Extraer host, user, password, db de la URL si es necesario, o usar directamente
      // pg_dump soporta connection string como parámetro
      await execAsync(`pg_dump "${process.env.DATABASE_URL}" -f "${pgDumpFile}"`);
      console.log('✅ PostgreSQL backup completado.');
    } else {
      console.log('⚠️ DATABASE_URL no definida, saltando PostgreSQL backup.');
    }

    // 2. MongoDB Backup
    if (process.env.MONGO_URI) {
      console.log('📦 Realizando backup de MongoDB...');
      await execAsync(`mongodump --uri="${process.env.MONGO_URI}" --out="${mongoDumpDir}"`);
      console.log('✅ MongoDB backup completado.');
    } else {
      console.log('ℹ️ MONGO_URI no definida, saltando MongoDB backup.');
    }

    // 3. Comprimir Archivos
    console.log('🗜️ Comprimiendo archivos...');
    await compressFiles(zipFile, pgDumpFile, mongoDumpDir);
    console.log(`✅ Archivo ZIP creado: ${zipFile}`);

    // 4. Subir a Google Drive
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID) {
      console.log('☁️ Subiendo a Google Drive...');
      await uploadToDrive(zipFile, `backup-${timestamp}.zip`);
      console.log('✅ Backup subido exitosamente.');
    } else {
      console.log('⚠️ Credenciales de Google Drive no configuradas, saltando subida.');
    }

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
  } finally {
    // 5. Limpieza
    console.log('🧹 Limpiando archivos temporales...');
    if (fs.existsSync(pgDumpFile)) fs.unlinkSync(pgDumpFile);
    if (fs.existsSync(mongoDumpDir)) fs.rmSync(mongoDumpDir, { recursive: true, force: true });
    if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
    console.log('✅ Limpieza completada.');
  }
}

function compressFiles(zipPath: string, pgFile: string, mongoDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    if (fs.existsSync(pgFile)) {
      archive.file(pgFile, { name: 'postgresql.sql' });
    }

    if (fs.existsSync(mongoDir)) {
      archive.directory(mongoDir, 'mongodb');
    }

    archive.finalize();
  });
}

async function uploadToDrive(filePath: string, fileName: string) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      parents: [folderId!],
    };

    const media = {
      mimeType: 'application/zip',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    console.log('File Id:', response.data.id);
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    throw error;
  }
}
