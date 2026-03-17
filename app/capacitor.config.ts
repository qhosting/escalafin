import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.escalafin.app',
  appName: 'Escalafin',
  webDir: 'public',
  server: {
    url: 'https://escalafin.com',
    cleartext: true
  }
};

export default config;
