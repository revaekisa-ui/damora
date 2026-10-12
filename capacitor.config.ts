import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weddfin.app',
  appName: 'weddfin',
  webDir: 'dist',
  server: {
    url: 'https://damorapictures.netlify.app',
    cleartext: false
  }
};

export default config;
