import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartfollowup.app',
  appName: 'نظام المتابعة الميدانية الذكي',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
