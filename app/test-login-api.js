
// Script para probar login via API NextAuth
require('dotenv').config();

async function testLoginAPI() {
  console.log('🧪 Probando login via API NextAuth...');
  
  // Simular un POST request a la API de NextAuth
  const loginData = {
    email: 'admin@escalafin.com',
    password: 'admin123',
    redirect: 'false',
    json: 'true'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(loginData)
    });

    console.log('📊 Response status:', response.status);
    const result = await response.text();
    console.log('📄 Response body:', result);

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// testLoginAPI();

// Por ahora, solo verificar que podemos importar nextauth
console.log('✅ Script cargado correctamente');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
