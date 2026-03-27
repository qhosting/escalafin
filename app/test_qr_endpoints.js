
const axios = require('axios');
async function testQR() {
  const url = 'https://waha.qhosting.net';
  const key = '2a92eb04791843f5b4093f21a4306960';
  const session = 'demo';
  try {
    const res = await axios.get(`${url}/api/sessions/${session}/qr`, {
      headers: { 'X-Api-Key': key }
    });
    console.log('QR Status:', res.status);
    console.log('QR Response Data (first 50 chars):', JSON.stringify(res.data).substring(0, 50));
  } catch (e) {
    console.log('QR fetch failed:', e.response?.status || e.message);
  }
}
testQR();
