
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

    // 2. Redis Backup (Dump RDB)
    if (process.env.REDIS_URL) {
      console.log('📦 Realizando backup de Redis...');
      // redis-cli -u redis://... --rdb ./dump.rdb
      // Se requiere que redis-cli esté instalado en la imagen Docker base.
      // Debian bookworm slim base ya tiene tools básicas, pero redis-tools puede necesitar instalarse.
      // Por ahora asumimos que redis-tools estara disponible o usaremos un comando compatible si falla, o simplemente warning.
      // En este contexto, intentaremos usar redis-cli si el usuario lo configura.
      const redisDumpFile = path.join(BACKUP_DIR, `redis_dump_${timestamp}.rdb`);
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

    // Buscar archivos RDB de Redis (podemos usar glob si el nombre varia, pero asumimos el timestamp exacto que pasamos antes es dificil de pasar aqui sin refactorizar firma)
    // Para simplificar, buscamos cualquier .rdb en el directorio de backup que coincida parcialmente o simplemente pasamos el archivo si lo tuvieramos.
    // Lo mejor es refactorizar compressFiles para recibir lista de archivos.
    // O mejor aun, en el paso anterior teniamos redisDumpFile. Pasemoslo como argumento opcional o simplemente busquemos *.rdb en el directorio temporal

    // Quick fix: iterar el directorio backup buscando .rdb
    const files = fs.readdirSync(path.dirname(zipPath));
    files.forEach(file => {
      if (file.endsWith('.rdb')) {
        archive.file(path.join(path.dirname(zipPath), file), { name: 'dump.rdb' });
      }
    });

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
