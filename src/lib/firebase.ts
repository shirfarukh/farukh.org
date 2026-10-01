import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator,
  Auth
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 'demo-api-key',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 'demo-learning-app.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || 'demo-learning-app',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 'demo-learning-app.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || '1234567890',
  appId: Constants.expoConfig?.extra?.firebaseAppId || '1:1234567890:web:1234567890',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth/react-native');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

const useEmulators = Constants.expoConfig?.extra?.useEmulators ?? true;
const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

if (useEmulators && typeof window !== 'undefined' && !(global as any)._firebaseEmulatorsConnected) {
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
    connectStorageEmulator(storage, host, 9199);
    (global as any)._firebaseEmulatorsConnected = true;
    console.log('Connected to Firebase Emulators on host:', host);
  } catch (err) {
    console.warn('Firebase emulator connection warning:', err);
  }
}

export { app, auth, db, functions, storage };
