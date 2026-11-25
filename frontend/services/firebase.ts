import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Ensure WebBrowser finishes any pending session
WebBrowser.maybeCompleteAuthSession();

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

export async function loginWithGoogle() {
  if (Platform.OS === 'web') {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please verify Firebase configuration.');
    }
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      phoneNumber: result.user.phoneNumber,
    };
  }

  // Mobile Native Flow (Android & iOS Expo Go)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.25.252.42:8000';
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const redirectUri = Linking.createURL('auth');
  const authUrl = `${apiUrl}/auth/google-web?session_id=${sessionId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  // Launch browser sheet
  WebBrowser.openBrowserAsync(authUrl);

  // Poll backend session until user signs in (up to 90 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 90000) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const resp = await fetch(`${apiUrl}/auth/google-session/${sessionId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'ready' && data.id_token) {
          // Success! Automatically close the in-app browser
          try {
            await WebBrowser.dismissBrowser();
          } catch (e) {}

          return {
            user: null,
            idToken: data.id_token,
            email: data.email || '',
            displayName: data.name || '',
            photoURL: null,
            phoneNumber: null,
          };
        }
      }
    } catch (e) {}
  }

  try {
    await WebBrowser.dismissBrowser();
  } catch (e) {}
  throw new Error('Google sign-in timed out. Please try again.');
}

export { auth, GoogleAuthProvider };
