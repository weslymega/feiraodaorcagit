import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.feiraodaorca.app',
  appName: 'Feirão da Orca',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  }
};

export default config;
