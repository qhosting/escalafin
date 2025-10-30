const crypto = require('crypto');

function generarSecreto(longitud = 64) {
  return crypto.randomBytes(longitud).toString('base64').slice(0, longitud);
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           NUEVOS SECRETOS GENERADOS - ESCALAFIN               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const nextauthSecret = generarSecreto(64);
const jwtSecret = generarSecreto(64);

console.log('NEXTAUTH_SECRET (nuevo):');
console.log('─────────────────────────────────────────────────────────────────');
console.log(nextauthSecret);
console.log('\n');

console.log('JWT_SECRET (nuevo):');
console.log('─────────────────────────────────────────────────────────────────');
console.log(jwtSecret);
console.log('\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('VARIABLES DE ENTORNO COMPLETAS PARA EASYPANEL');
console.log('═══════════════════════════════════════════════════════════════\n');

const envVars = `DATABASE_URL=postgresql://postgres:fa8853b6e623ed411e27@cloudmx_escalafin-db:5432/escalafin-db?schema=public
NEXTAUTH_URL=https://$(PRIMARY_DOMAIN)
NEXTAUTH_SECRET=${nextauthSecret}
JWT_SECRET=${jwtSecret}
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0`;

console.log(envVars);
console.log('\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('NOTAS IMPORTANTES');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✓ Secretos generados con crypto.randomBytes()');
console.log('✓ 64 caracteres cada uno (alta seguridad)');
console.log('✓ Base64 encoding para compatibilidad');
console.log('\n⚠️  IMPORTANTE:');
console.log('   - NO compartas estos secretos públicamente');
console.log('   - Guárdalos en un lugar seguro');
console.log('   - Copia y pega en EasyPanel → Environment Variables');
console.log('   - Después de actualizar, haz Rebuild de la app');
console.log('\n');
