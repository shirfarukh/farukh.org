import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FARUKH.ORG',
  slug: 'farukh-org',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'org.farukh.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
    package: 'org.farukh.app',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-sharing',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#0F172A',
      },
    ],
  ],
  scheme: 'learningapp',
  extra: {
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAFlfzqkfZuZaiA6SIVP3AdhVyaRuBSt4c',
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'farukh-org.firebaseapp.com',
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'farukh-org',
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'farukh-org.firebasestorage.app',
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '986347740546',
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:986347740546:web:2f647399993d8d5396439b',
    firebaseDatabaseUrl: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://farukh-org-default-rtdb.europe-west1.firebasedatabase.app',
    firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-QB1YECVRVD',
    useEmulators: process.env.EXPO_PUBLIC_USE_EMULATORS === 'true',
  },
});
