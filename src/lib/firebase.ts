import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error - getReactNativePersistence exists in React Native bundle of firebase/auth
  getReactNativePersistence,
  connectAuthEmulator,
  Auth,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 'AIzaSyAFlfzqkfZuZaiA6SIVP3AdhVyaRuBSt4c',
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 'farukh-org.firebaseapp.com',
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseUrl || 'https://farukh-org-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || 'farukh-org',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 'farukh-org.firebasestorage.app',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || '986347740546',
  appId: Constants.expoConfig?.extra?.firebaseAppId || '1:986347740546:web:2f647399993d8d5396439b',
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || 'G-QB1YECVRVD',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: ReturnType<typeof getAuth>;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    const persistence =
      typeof getReactNativePersistence === 'function'
        ? getReactNativePersistence(AsyncStorage)
        : undefined;
    auth = persistence
      ? initializeAuth(app, { persistence })
      : getAuth(app);
  }
} catch (e: any) {
  try {
    auth = getAuth(app);
  } catch {
    try {
      auth = initializeAuth(app);
    } catch {
      console.warn('Firebase Auth failed to initialize during startup:', e);
      auth = {} as any;
    }
  }
}


const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

const useEmulators = Constants.expoConfig?.extra?.useEmulators === true;
const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

if (useEmulators && !(global as any)._firebaseEmulatorsConnected) {
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
    connectStorageEmulator(storage, host, 9199);
    connectDatabaseEmulator(rtdb, host, 9000);
    (global as any)._firebaseEmulatorsConnected = true;
    console.log('Connected to Firebase Emulators on host:', host);
  } catch {
    console.log('Using standard Firebase backend service mode');
  }
}

let analytics: Analytics | null = null;
if (Platform.OS === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, auth, db, functions, storage, rtdb, analytics };
