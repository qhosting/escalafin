
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
  const redisDumpFile = path.join(BACKUP_DIR, `redis_dump_${timestamp}.rdb`);
  const zipFile = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);

  try {
    // 1. PostgreSQL Backup
    if (process.env.DATABASE_URL) {
      console.log('📦 Realizando backup de PostgreSQL...');
      await execAsync(`pg_dump "${process.env.DATABASE_URL}" -f "${pgDumpFile}"`);
      console.log('✅ PostgreSQL backup completado.');
    } else {
      console.log('⚠️ DATABASE_URL no definida, saltando PostgreSQL backup.');
    }

    // 2. Redis Backup (Dump RDB)
    if (process.env.REDIS_URL) {
      console.log('📦 Realizando backup de Redis...');
      try {
        await execAsync(`redis-cli -u "${process.env.REDIS_URL}" --rdb "${redisDumpFile}"`);
        console.log('✅ Redis backup completado.');
      } catch (redisError) {
        console.warn('⚠️ No se pudo realizar backup de Redis (¿redis-tools instalado?):', redisError);
      }
    } else {
      console.log('ℹ️ REDIS_URL no definida, saltando Redis backup.');
    }

    // 3. Comprimir Archivos
    console.log('🗜️ Comprimiendo archivos...');
    await compressFiles(zipFile, pgDumpFile, redisDumpFile);
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
    if (fs.existsSync(redisDumpFile)) fs.unlinkSync(redisDumpFile);

    // Limpiar RDBs
    const files = fs.readdirSync(BACKUP_DIR);
    files.forEach(file => {
      if (file.endsWith('.rdb')) {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
      }
    });

    if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
    console.log('✅ Limpieza completada.');
  }
}

function compressFiles(zipPath: string, pgFile: string, redisFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    if (fs.existsSync(pgFile)) {
      archive.file(pgFile, { name: 'postgresql.sql' });
    }

    if (fs.existsSync(redisFile)) {
      archive.file(redisFile, { name: 'dump.rdb' });
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
