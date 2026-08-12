import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.escalafin.app',
  appName: 'EscalaFin',
  webDir: '.next',
  bundledWebRuntime: false,

  // Server config — points to Next.js in dev/prod
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://app.escalafin.com',
    cleartext: true,
  },

  plugins: {
    // Push Notifications — Firebase Cloud Messaging
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications for offline alerts
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1d4ed8',
      sound: 'beep.wav',
    },

    // Geolocation — background tracking for field collectors
    Geolocation: {
      // No extra config needed; permissions declared in native manifests
    },

    // Camera — native capture for KYC and visit evidence
    Camera: {
      resultType: 'uri',
      source: 'camera',
      quality: 80,
      correctOrientation: true,
    },

    // Filesystem — save receipts and reports
    Filesystem: {
      directory: 'Documents',
    },

    // App behavior
    App: {
      backgroundColor: '#0f172a',
    },

    // SplashScreen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1d4ed8',
      showSpinner: false,
    },

    // Status Bar
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1d4ed8',
    },
  },

  // Android-specific config
  android: {
    buildOptions: {
      debuggingEnabled: false,
      keystorePath: 'escalafin.keystore',
      keystoreAlias: 'escalafin',
    },
  },

  // iOS-specific config
  ios: {
    scheme: 'EscalaFin',
    preferredContentMode: 'mobile',
  },
};

export default config;
