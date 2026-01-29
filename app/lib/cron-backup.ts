
import cron from 'node-cron';
import { performBackup } from './backup-service';

let isScheduled = false;

export function scheduleBackup() {
  if (isScheduled) {
    console.log('Backup job already scheduled.');
    return;
  }

  // 3:00 AM daily
  cron.schedule('0 3 * * *', async () => {
    console.log('🕒 Ejecutando backup programado (3:00 AM)...');
    await performBackup();
  });

  isScheduled = true;
  console.log('✅ Backup programado para las 3:00 AM diariamente.');
}
