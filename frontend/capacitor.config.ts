import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mygoat.app',
  appName: 'My Goat',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Allows testing against the backend on your local Wi-Fi (http://...).
    // Set to false once the API is served over HTTPS.
    cleartext: true,
  },
  android: {
    // The app is served from https://localhost, so calls to an HTTP LAN
    // address are "mixed content". Remove this when using HTTPS.
    allowMixedContent: true,
  },
};

export default config;
