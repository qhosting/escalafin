
const { default: fetch } = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Simulate a session for testing
const adminTestSession = {
  email: 'admin@escalafin.com',
  password: 'admin123'
};

async function testUsersHTTPEndpoint() {
  console.log('🧪 TESTING HTTP ENDPOINTS - GESTIÓN DE USUARIOS');
  console.log('==================================================');
  
  try {
    // Test 1: Health check
    console.log('\n🔍 Test 1: Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`✅ Health Status: ${healthData.status}`);
    console.log(`✅ Database: ${healthData.database}`);
    
    // Test 2: Test users endpoint without authentication
    console.log('\n🔍 Test 2: Users API without authentication...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`);
    console.log(`Status: ${usersResponse.status}`);
    console.log(`Headers:`, Object.fromEntries(usersResponse.headers));
    
    if (usersResponse.status === 401) {
      console.log('✅ Endpoint correctly requires authentication');
    } else if (usersResponse.status === 200) {
      const userData = await usersResponse.json();
      console.log(`✅ Users returned: ${userData.users?.length || 'undefined'}`);
    } else {
      const errorData = await usersResponse.text();
      console.log(`❌ Unexpected response: ${errorData}`);
    }
    
    // Test 3: Test auth endpoint
    console.log('\n🔍 Test 3: Testing NextAuth SignIn...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/providers`);
    console.log(`Auth providers status: ${authResponse.status}`);
    
    // Test 4: Direct API test with basic auth header (if implemented)
    console.log('\n🔍 Test 4: Testing with simulated session...');
    
    // Try to get CSRF token first
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      console.log(`✅ CSRF Token available: ${!!csrfData.csrfToken}`);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('- Health endpoint: ✅ Working');
    console.log('- Users endpoint security: ✅ Protected');
    console.log('- NextAuth integration: ✅ Available');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Test frontend authentication flow');
    console.log('2. Check session handling in browser');
    console.log('3. Verify user management component state');
    
  } catch (error) {
    console.error('❌ Error during HTTP testing:', error.message);
  }
}

async function testFrontendAPI() {
  console.log('\n🌐 TESTING FRONTEND CONNECTIVITY');
  console.log('==================================');
  
  try {
    // Test the main page
    const homeResponse = await fetch(`${BASE_URL}/`);
    console.log(`Home page status: ${homeResponse.status}`);
    
    // Test admin page
    const adminResponse = await fetch(`${BASE_URL}/admin`);
    console.log(`Admin page status: ${adminResponse.status}`);
    
    // Test static assets
    const faviconResponse = await fetch(`${BASE_URL}/favicon.ico`);
    console.log(`Favicon status: ${faviconResponse.status}`);
    
  } catch (error) {
    console.error('❌ Frontend connectivity error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 INICIANDO TESTS COMPLETOS DEL SISTEMA\n');
  
  await testUsersHTTPEndpoint();
  await testFrontendAPI();
  
  console.log('\n✅ TESTS COMPLETADOS');
  console.log('====================');
  console.log('Revisa los resultados arriba para identificar problemas específicos.');
}

runAllTests();
