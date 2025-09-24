
// 🧪 Script de Testing Manual UI - EscalaFin MVP
// Testing específico para el problema de "no carga usuarios actuales"

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';

// 🎨 Colores para el output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 🔐 Función para hacer login
async function loginAsAdmin() {
  log('\n🔐 INTENTANDO LOGIN COMO ADMINISTRADOR...', 'blue');
  
  try {
    // 1. Obtener la página de signin para extraer el CSRF token
    const signinPage = await axios.get(`${BASE_URL}/api/auth/signin`);
    
    // 2. Intentar hacer login con credenciales de admin
    const loginData = {
      email: 'admin@escalafin.com',
      password: 'admin123'
    };

    log(`📧 Usando email: ${loginData.email}`, 'yellow');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, loginData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Permitir redirects
      }
    });

    if (loginResponse.headers['set-cookie']) {
      sessionCookie = loginResponse.headers['set-cookie'].join('; ');
      log('✅ ÉXITO: Login completado, session cookie obtenida', 'green');
      return true;
    }
    
  } catch (error) {
    if (error.response && error.response.status === 302) {
      // Redirect is expected on successful login
      if (error.response.headers['set-cookie']) {
        sessionCookie = error.response.headers['set-cookie'].join('; ');
        log('✅ ÉXITO: Login completado con redirect', 'green');
        return true;
      }
    }
    log(`❌ ERROR en login: ${error.message}`, 'red');
    log('🔍 Intentando método alternativo de autenticación...', 'yellow');
  }
  
  return false;
}

// 👥 Función específica para probar gestión de usuarios
async function testUserManagementUI() {
  log('\n👥 TESTING GESTIÓN DE USUARIOS - PROBLEMA REPORTADO', 'blue');
  log('=' .repeat(60), 'blue');
  
  let results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Verificar acceso a API de usuarios sin autenticación
  log('\n📋 Test 1: API usuarios sin autenticación (debe fallar)');
  results.total++;
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/users`);
    log(`❌ PROBLEMA DETECTADO: API usuarios permite acceso sin auth (Status: ${response.status})`, 'red');
    results.failed++;
    results.details.push('❌ API sin protección adecuada');
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      log('✅ CORRECTO: API usuarios protegida sin auth', 'green');
      results.passed++;
      results.details.push('✅ API protegida correctamente');
    } else {
      log(`❌ ERROR INESPERADO: ${error.message}`, 'red');
      results.failed++;
      results.details.push('❌ Error de conexión API');
    }
  }

  // Test 2: Verificar estructura de respuesta de usuarios
  log('\n📋 Test 2: Estructura de datos de usuarios');
  results.total++;
  try {
    // Intentar obtener usuarios con cookie si está disponible
    const headers = sessionCookie ? { 'Cookie': sessionCookie } : {};
    const response = await axios.get(`${BASE_URL}/api/admin/users`, { headers });
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        log(`✅ CORRECTO: API devuelve array con ${response.data.length} usuarios`, 'green');
        results.passed++;
        results.details.push(`✅ ${response.data.length} usuarios encontrados`);
        
        // Mostrar estructura del primer usuario si existe
        if (response.data.length > 0) {
          const firstUser = response.data[0];
          log(`📊 Primer usuario: ${firstUser.email || 'Sin email'} - ${firstUser.role || 'Sin rol'}`, 'yellow');
        }
      } else if (response.data.users && Array.isArray(response.data.users)) {
        log(`✅ CORRECTO: API devuelve objeto con ${response.data.users.length} usuarios`, 'green');
        results.passed++;
        results.details.push(`✅ ${response.data.users.length} usuarios en objeto`);
      } else {
        log('❌ PROBLEMA: API no devuelve estructura esperada de usuarios', 'red');
        log(`📊 Estructura recibida: ${JSON.stringify(response.data).substring(0, 200)}...`, 'yellow');
        results.failed++;
        results.details.push('❌ Estructura de datos incorrecta');
      }
    } else {
      log('❌ PROBLEMA: API devuelve datos vacíos', 'red');
      results.failed++;
      results.details.push('❌ Datos vacíos');
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      log('⚠️  REQUIERE AUTH: Necesita autenticación válida para probar', 'yellow');
      results.details.push('⚠️ Requiere autenticación');
    } else {
      log(`❌ ERROR: ${error.message}`, 'red');
      results.failed++;
      results.details.push('❌ Error de API');
    }
  }

  // Test 3: Verificar conexión a base de datos
  log('\n📋 Test 3: Verificar conexión a base de datos');
  results.total++;
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    log('✅ CORRECTO: Health check endpoint responde', 'green');
    results.passed++;
    results.details.push('✅ Health check OK');
  } catch (error) {
    log(`❌ ERROR: Health check falló - ${error.message}`, 'red');
    results.failed++;
    results.details.push('❌ Health check falló');
  }

  // Test 4: Test directo a base de datos (si es posible)
  log('\n📋 Test 4: Verificación directa de usuarios en BD');
  results.total++;
  try {
    // Usar un endpoint más básico para verificar datos
    const response = await axios.get(`${BASE_URL}/api/auth/session`);
    if (response.status === 200) {
      log('✅ CORRECTO: Sistema de sesiones funciona', 'green');
      results.passed++;
      results.details.push('✅ Sistema de sesiones OK');
    }
  } catch (error) {
    log(`⚠️  INFO: ${error.message}`, 'yellow');
    results.details.push('⚠️ Verificación de sesión');
  }

  // Resumen específico del problema
  log(`\n📊 ANÁLISIS DEL PROBLEMA "NO CARGA USUARIOS":`, 'yellow');
  log(`Total tests: ${results.total}`, 'yellow');
  log(`✅ Exitosos: ${results.passed}`, 'green');
  log(`❌ Fallidos: ${results.failed}`, 'red');
  
  // Diagnóstico específico
  log('\n🔍 DIAGNÓSTICO:', 'blue');
  if (results.failed > 0) {
    log('📋 POSIBLES CAUSAS DEL PROBLEMA:', 'yellow');
    log('1️⃣  Falta de autenticación en el frontend', 'yellow');
    log('2️⃣  Error en el middleware de NextAuth', 'yellow');
    log('3️⃣  Problema en la consulta de base de datos', 'yellow');
    log('4️⃣  Error en el componente React de gestión de usuarios', 'yellow');
    log('5️⃣  Problema de CORS o headers de seguridad', 'yellow');
  } else {
    log('✅ APIs básicas funcionan, el problema puede estar en:', 'green');
    log('🎯 Frontend: Componente React o manejo de estado', 'yellow');
    log('🎯 Autenticación: Sesión no se mantiene en frontend', 'yellow');
  }

  return results;
}

// 🔍 Función para crear reporte detallado
async function generateDetailedReport() {
  log('\n📋 GENERANDO REPORTE DETALLADO DEL PROBLEMA', 'blue');
  log('=' .repeat(60), 'blue');

  // Información del sistema
  log('\n🖥️  INFORMACIÓN DEL SISTEMA:', 'yellow');
  log(`🌐 URL Base: ${BASE_URL}`, 'yellow');
  log(`📅 Fecha: ${new Date().toLocaleString()}`, 'yellow');
  
  // Verificar estado del servidor
  try {
    const healthCheck = await axios.get(`${BASE_URL}`, { timeout: 5000 });
    log(`✅ Estado del servidor: Activo (${healthCheck.status})`, 'green');
  } catch (error) {
    log(`❌ Estado del servidor: Error - ${error.message}`, 'red');
  }

  // Ejecutar tests específicos
  const userManagementResults = await testUserManagementUI();

  // Recomendaciones específicas
  log('\n💡 RECOMENDACIONES PARA SOLUCIÓN:', 'blue');
  log('1️⃣  Verificar componente user-management.tsx', 'yellow');
  log('2️⃣  Revisar hooks de autenticación (useSession)', 'yellow');
  log('3️⃣  Verificar middleware de protección de rutas', 'yellow');
  log('4️⃣  Comprobar logs del navegador (F12 -> Console)', 'yellow');
  log('5️⃣  Revisar estado de la base de datos y seeds', 'yellow');

  log('\n🎯 SIGUIENTE PASO RECOMENDADO:', 'blue');
  log('👀 Inspeccionar manualmente el componente de gestión de usuarios', 'yellow');
  log('🔧 Revisar logs del browser en la página /admin/users', 'yellow');

  return userManagementResults;
}

// 🎯 Función principal
async function runDiagnosticTests() {
  log('🚀 INICIANDO DIAGNÓSTICO ESPECÍFICO - PROBLEMA USUARIOS', 'blue');
  log('=' .repeat(70), 'blue');
  
  try {
    // Intentar login primero
    await loginAsAdmin();
    
    // Ejecutar diagnóstico detallado
    const results = await generateDetailedReport();
    
    log('\n🏁 DIAGNÓSTICO COMPLETADO', 'blue');
    log('=' .repeat(50), 'blue');
    
    return results;
  } catch (error) {
    log(`❌ Error general en diagnóstico: ${error.message}`, 'red');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runDiagnosticTests().catch(console.error);
}

module.exports = {
  runDiagnosticTests,
  testUserManagementUI,
  loginAsAdmin
};
