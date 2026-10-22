import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weddfin.app',
  appName: 'Filda Makeup',
  webDir: 'dist',
  server: {
    url: 'https://damorapictures.netlify.app',
    cleartext: false
  }
};

export default config;
