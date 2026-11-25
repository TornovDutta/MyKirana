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
import { API_BASE_URL } from '../constants/config';

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
  const apiUrl = API_BASE_URL;
  const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const redirectUri = Linking.createURL('auth');
  const authUrl = `${apiUrl}/auth/google-web?session_id=${sessionId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  let isComplete = false;

  // Poll backend session in background until user signs in (up to 90 seconds)
  const pollSession = async () => {
    const startTime = Date.now();
    while (!isComplete && Date.now() - startTime < 90000) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (isComplete) break;
      try {
        const resp = await fetch(`${apiUrl}/auth/google-session/${sessionId}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'ready' && data.id_token) {
            return data;
          }
        }
      } catch (e) {
        // Network error during poll, will retry next second
      }
    }
    return null;
  };

  try {
    // Open in-app browser with auth session listener and race with background session polling
    const authSessionPromise = WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    const sessionPollPromise = pollSession();

    const winner = await Promise.race([
      authSessionPromise.then((res) => ({ type: 'browser' as const, res })),
      sessionPollPromise.then((data) => ({ type: 'poll' as const, data })),
    ]);

    isComplete = true;

    // Case 1: Session poll detected ready id_token first
    if (winner.type === 'poll' && winner.data?.id_token) {
      try {
        await WebBrowser.dismissAuthSession();
      } catch (e) {}
      try {
        await WebBrowser.dismissBrowser();
      } catch (e) {}

      return {
        user: null,
        idToken: winner.data.id_token,
        email: winner.data.email || '',
        displayName: winner.data.name || '',
        photoURL: null,
        phoneNumber: null,
      };
    }

    // Case 2: Browser redirect returned first with success URL
    if (winner.type === 'browser') {
      const browserRes = winner.res;
      if (browserRes.type === 'success' && browserRes.url) {
        const parsed = Linking.parse(browserRes.url);
        const token = parsed.queryParams?.id_token as string;
        if (token) {
          return {
            user: null,
            idToken: token,
            email: (parsed.queryParams?.email as string) || '',
            displayName: (parsed.queryParams?.name as string) || '',
            photoURL: null,
            phoneNumber: null,
          };
        }
      }

      // If browser was dismissed/closed, check if session was recorded right before dismiss
      try {
        const resp = await fetch(`${apiUrl}/auth/google-session/${sessionId}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'ready' && data.id_token) {
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

    // Fallback: wait a few seconds more for session in case of slight delay
    const finalData = await sessionPollPromise;
    if (finalData?.id_token) {
      return {
        user: null,
        idToken: finalData.id_token,
        email: finalData.email || '',
        displayName: finalData.name || '',
        photoURL: null,
        phoneNumber: null,
      };
    }

    throw new Error('Google sign-in was cancelled or timed out.');
  } finally {
    isComplete = true;
    try {
      await WebBrowser.dismissAuthSession();
    } catch (e) {}
    try {
      await WebBrowser.dismissBrowser();
    } catch (e) {}
  }
}

export { auth, GoogleAuthProvider };
