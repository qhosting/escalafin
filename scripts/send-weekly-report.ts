
import axios from 'axios';

async function main() {
  const url = 'http://localhost:3000/api/cron/weekly-report';
  const secret = process.env.CRON_SECRET || 'secret-cron-token';

  try {
    console.log(`Triggering weekly report at ${url}...`);
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${secret}` }
    });
    console.log('Success:', response.data);
  } catch (error: any) {
    console.error('Error triggering report:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
    }
  }
}

main();
