import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey || undefined,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || undefined,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || undefined,
};

let auth: Auth | null = null;

if (apiKey && apiKey.trim() !== '') {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { auth };
