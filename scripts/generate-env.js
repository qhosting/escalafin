
/**
 * Generador de archivo .env para EscalaFin
 * 
 * Este script genera un archivo .env con valores seguros y aleatorios
 * para todas las variables necesarias.
 * 
 * Uso:
 *   node scripts/generate-env.js [opciones]
 * 
 * Opciones:
 *   --output <path>     Ruta del archivo de salida (default: .env)
 *   --db-host <host>    Host de la base de datos (default: localhost)
 *   --db-port <port>    Puerto de la base de datos (default: 5432)
 *   --db-name <name>    Nombre de la base de datos (default: escalafin)
 *   --db-user <user>    Usuario de la base de datos (default: postgres)
 *   --db-pass <pass>    Password de la base de datos (generado si no se proporciona)
 *   --app-url <url>     URL de la aplicación (default: http://localhost:3000)
 *   --master-pass <p>   Password maestra (se generará el hash)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuración por defecto
const config = {
  dbHost: 'localhost',
  dbPort: '5432',
  dbName: 'escalafin',
  dbUser: 'postgres',
  dbPass: null,
  appUrl: 'http://localhost:3000',
  masterPass: null,
  output: '.env',
};

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

// Funciones de logging
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function logStep(step, total, message) {
  log(`\n[${step}/${total}] ${message}`, colors.bright + colors.blue);
  console.log('─'.repeat(60));
}

// Generar string aleatorio seguro
function generateSecureString(length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
}

// Parsear argumentos
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--output':
        config.output = nextArg;
        i++;
        break;
      case '--db-host':
        config.dbHost = nextArg;
        i++;
        break;
      case '--db-port':
        config.dbPort = nextArg;
        i++;
        break;
      case '--db-name':
        config.dbName = nextArg;
        i++;
        break;
      case '--db-user':
        config.dbUser = nextArg;
        i++;
        break;
      case '--db-pass':
        config.dbPass = nextArg;
        i++;
        break;
      case '--app-url':
        config.appUrl = nextArg;
        i++;
        break;
      case '--master-pass':
        config.masterPass = nextArg;
        i++;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }
}

function printHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     GENERADOR DE ARCHIVO .ENV - ESCALAFIN MVP                  ║
╚════════════════════════════════════════════════════════════════╝

Uso: node scripts/generate-env.js [opciones]

Opciones:
  --output <path>     Ruta del archivo de salida (default: .env)
  --db-host <host>    Host de la base de datos (default: localhost)
  --db-port <port>    Puerto de la base de datos (default: 5432)
  --db-name <name>    Nombre de la base de datos (default: escalafin)
  --db-user <user>    Usuario de la base de datos (default: postgres)
  --db-pass <pass>    Password de la base de datos (generado si no se proporciona)
  --app-url <url>     URL de la aplicación (default: http://localhost:3000)
  --master-pass <p>   Password maestra (se generará el hash)
  --help              Muestra esta ayuda

Ejemplo:
  node scripts/generate-env.js --db-host db.example.com --db-pass mypassword
  `);
}

// Generar el archivo .env
async function generateEnvFile() {
  logStep(1, 5, 'Generando valores seguros...');
  
  // Generar valores si no están configurados
  const dbPassword = config.dbPass || generateSecureString(32);
  const nextauthSecret = generateSecureString(64);
  const jwtSecret = generateSecureString(64);
  
  logSuccess(`NEXTAUTH_SECRET: ${nextauthSecret.substring(0, 10)}...`);
  logSuccess(`JWT_SECRET: ${jwtSecret.substring(0, 10)}...`);
  logSuccess(`DB_PASSWORD: ${dbPassword.substring(0, 10)}...`);
  
  logStep(2, 5, 'Construyendo DATABASE_URL...');
  
  const databaseUrl = `postgresql://${config.dbUser}:${dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}?schema=public`;
  logSuccess(`DATABASE_URL configurada`);
  
  logStep(3, 5, 'Configurando variables de aplicación...');
  
  const envContent = `# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE ESCALAFIN MVP
# Generado automáticamente el: ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════

# ──────────────────────────────────────────────────────────────
# DATABASE
# ──────────────────────────────────────────────────────────────
DATABASE_URL="${databaseUrl}"

# ──────────────────────────────────────────────────────────────
# AUTHENTICATION
# ──────────────────────────────────────────────────────────────
NEXTAUTH_URL="${config.appUrl}"
NEXTAUTH_SECRET="${nextauthSecret}"
JWT_SECRET="${jwtSecret}"

# ──────────────────────────────────────────────────────────────
# APPLICATION
# ──────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# ──────────────────────────────────────────────────────────────
# OPENPAY (Pagos)
# ──────────────────────────────────────────────────────────────
OPENPAY_MERCHANT_ID=demo_merchant
OPENPAY_PRIVATE_KEY=demo_private_key
OPENPAY_PUBLIC_KEY=demo_public_key
OPENPAY_BASE_URL=https://sandbox-api.openpay.mx/v1

# ──────────────────────────────────────────────────────────────
# STORAGE (Archivos)
# ──────────────────────────────────────────────────────────────
STORAGE_TYPE=local
LOCAL_UPLOAD_DIR=/app/uploads
LOCAL_BASE_URL=/api/files/serve
LOCAL_MAX_FILE_SIZE=10

# Descomentar para usar AWS S3
# AWS_BUCKET_NAME=escalafin-uploads
# AWS_REGION=us-east-1
# AWS_FOLDER_PREFIX=escalafin-mvp/
# S3_MAX_FILE_SIZE=10

# ──────────────────────────────────────────────────────────────
# WHATSAPP (Notificaciones)
# ──────────────────────────────────────────────────────────────
# Descomentar si usas EvolutionAPI
# EVOLUTION_API_URL=https://your-evolution-api.com
# EVOLUTION_API_KEY=your_api_key
# EVOLUTION_INSTANCE_NAME=escalafin

# ──────────────────────────────────────────────────────────────
# PUSH NOTIFICATIONS (PWA)
# ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here

# ═══════════════════════════════════════════════════════════════
# FIN DE CONFIGURACIÓN
# ═══════════════════════════════════════════════════════════════
`;

  logStep(4, 5, 'Escribiendo archivo .env...');
  
  const outputPath = path.resolve(config.output);
  
  // Verificar si el archivo existe
  if (fs.existsSync(outputPath)) {
    logWarning(`El archivo ${outputPath} ya existe`);
    const backup = `${outputPath}.backup-${Date.now()}`;
    fs.copyFileSync(outputPath, backup);
    logInfo(`Backup creado: ${backup}`);
  }
  
  fs.writeFileSync(outputPath, envContent, 'utf8');
  logSuccess(`Archivo generado: ${outputPath}`);
  
  logStep(5, 5, 'Generando archivo de resumen...');
  
  const summaryContent = `
╔════════════════════════════════════════════════════════════════╗
║           RESUMEN DE VARIABLES GENERADAS - ESCALAFIN           ║
╚════════════════════════════════════════════════════════════════╝

Fecha: ${new Date().toLocaleString()}

CREDENCIALES GENERADAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXTAUTH_SECRET:
${nextauthSecret}

JWT_SECRET:
${jwtSecret}

DATABASE_URL:
${databaseUrl}

CONFIGURACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App URL:        ${config.appUrl}
DB Host:        ${config.dbHost}
DB Port:        ${config.dbPort}
DB Name:        ${config.dbName}
DB User:        ${config.dbUser}
DB Password:    ${dbPassword}

IMPORTANTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Guarda este archivo en un lugar seguro
⚠️  No lo subas a Git ni lo compartas públicamente
⚠️  Usa estas credenciales en tu plataforma de deployment

PRÓXIMOS PASOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Copia el archivo .env al directorio /app
2. Configura estas variables en EasyPanel
3. Ejecuta las migraciones: yarn prisma migrate deploy
4. Seed la base de datos: yarn prisma db seed
5. Rebuild la aplicación

═══════════════════════════════════════════════════════════════
`;
  
  const summaryPath = path.resolve(path.dirname(outputPath), 'ENV_SUMMARY.txt');
  fs.writeFileSync(summaryPath, summaryContent, 'utf8');
  logSuccess(`Resumen guardado: ${summaryPath}`);
  
  console.log(summaryContent);
}

// Main
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     GENERADOR DE ARCHIVO .ENV - ESCALAFIN MVP                  ║
╚════════════════════════════════════════════════════════════════╝
`);
  
  parseArgs();
  
  try {
    await generateEnvFile();
    
    log('\n╔════════════════════════════════════════════════════════════════╗', colors.green);
    log('║                  ¡ARCHIVO .ENV GENERADO!                       ║', colors.green);
    log('╚════════════════════════════════════════════════════════════════╝\n', colors.green);
    
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
