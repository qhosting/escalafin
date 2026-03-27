
const axios = require('axios');
async function main() {
  const url = 'https://waha.qhosting.net';
  const key = '2a92eb04791843f5b4093f21a4306960';
  const session = 'demo';
  try {
    const res = await axios.get(`${url}/api/sessions/${session}`, {
      headers: { 'X-Api-Key': key }
    });
    console.log('Session Status:', res.data.status);
    console.log('Session Data:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('Session fetch failed:', e.response?.status || e.message);
  }
}
main();
