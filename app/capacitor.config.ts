import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.escalafin.app',
  appName: 'EscalaFin',
  // webDir apunta al output de Next.js. Para el wrapper nativo, usamos la URL del servidor.
  webDir: 'out',
  server: {
    // URL de producción — la app se muestra como WebView apuntando al servidor
    url: 'https://escalafin.com',
    cleartext: false,
    // Permite que la app funcione con HTTPS
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      // keystorePath: configurar en CI/CD para firma de producción
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e293b',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e293b',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
