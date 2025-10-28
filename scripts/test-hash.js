
/**
 * Test de Hashing de Passwords - EscalaFin
 * 
 * Propósito: Verificar y testear el hashing de passwords con bcrypt
 * 
 * NOTA: Ejecutar desde el directorio /app donde están las dependencias:
 *   cd app && node ../scripts/test-hash.js
 */

const path = require('path');
const appDir = path.join(__dirname, '../app');
const bcrypt = require(path.join(appDir, 'node_modules/bcryptjs'));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testHash() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           TEST DE HASHING - ESCALAFIN MVP                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const testPassword = 'admin123';
  
  log('1. Generando hash para password: ' + testPassword, colors.cyan);
  const hash = await bcrypt.hash(testPassword, 10);
  log('   Hash generado:', colors.green);
  log('   ' + hash + '\n');
  
  log('2. Verificando password correcto...', colors.cyan);
  const isValid = await bcrypt.compare(testPassword, hash);
  log('   Resultado: ' + (isValid ? '✓ VÁLIDO' : '✗ INVÁLIDO'), isValid ? colors.green : colors.yellow);
  
  log('\n3. Verificando password incorrecto...', colors.cyan);
  const isInvalid = await bcrypt.compare('wrongpassword', hash);
  log('   Resultado: ' + (isInvalid ? '✗ VÁLIDO (ERROR!)' : '✓ INVÁLIDO (CORRECTO)'), !isInvalid ? colors.green : colors.yellow);
  
  log('\n4. Hashes de usuarios de prueba:', colors.cyan);
  const users = [
    { email: 'admin@escalafin.com', password: 'admin123' },
    { email: 'carlos.lopez@escalafin.com', password: 'asesor123' },
    { email: 'juan.perez@email.com', password: 'cliente123' }
  ];
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    log(`   ${user.email}`, colors.blue);
    log(`   ${hash}\n`);
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
}

testHash().catch(console.error);
