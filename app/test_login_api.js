const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔄 Testing login API...');
    
    const response = await fetch('http://localhost:3456/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@escalafin.com',
        password: 'admin123',
        callbackUrl: '/',
        json: true,
      }),
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('📊 Response:', data);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLogin();
