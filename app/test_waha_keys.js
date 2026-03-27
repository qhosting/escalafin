
const axios = require('axios');

async function testKey(url, key, name) {
  try {
    const res = await axios.get(`${url}/api/sessions`, {
      headers: { 'X-Api-Key': key }
    });
    console.log(`Key ${name} (${key}): SUCCESS - StatusCode: ${res.status}`);
    return true;
  } catch (e) {
    console.log(`Key ${name} (${key}): FAILED - StatusCode: ${e.response?.status || e.message}`);
    return false;
  }
}

async function main() {
  const url = 'https://waha.qhosting.net';
  const plain = '4b509750da1944138320d42f7c03080e'; // PLAIN
  const other = '2a92eb04791843f5b4093f21a4306960'; // WAHA_API_KEY

  console.log('Testing WAHA keys...');
  await testKey(url, plain, 'PLAIN');
  await testKey(url, other, 'WAHA_API_KEY');
}

main();
