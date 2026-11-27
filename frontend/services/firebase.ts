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
  const redirectUri = Linking.createURL('login');
  const authUrl = `${apiUrl}/auth/google-web?session_id=${sessionId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  let isComplete = false;
  let urlSubscription: ReturnType<typeof Linking.addEventListener> | null = null;

  // Listen to incoming deep-link redirects directly as an extra safety net
  const deepLinkPromise = new Promise<{ id_token: string; email?: string; name?: string } | null>((resolve) => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      try {
        const parsed = Linking.parse(url);
        const token = parsed.queryParams?.id_token as string | undefined;
        if (token) {
          resolve({
            id_token: token,
            email: (parsed.queryParams?.email as string) || '',
            name: (parsed.queryParams?.name as string) || '',
          });
        }
      } catch {}
    });
    urlSubscription = sub;
  });

  // Poll backend session every 400ms for instant return detection
  const pollSession = async () => {
    const startTime = Date.now();
    while (!isComplete && Date.now() - startTime < 90000) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (isComplete) break;
      try {
        const resp = await fetch(`${apiUrl}/auth/google-session/${sessionId}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'ready' && data.id_token) {
            return data;
          }
        }
      } catch {
        // Network error during poll, will retry
      }
    }
    return null;
  };

  try {
    const authSessionPromise = WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    const sessionPollPromise = pollSession();

    const winner = await Promise.race([
      authSessionPromise.then((res) => ({ type: 'browser' as const, res })),
      sessionPollPromise.then((data) => ({ type: 'poll' as const, data })),
      deepLinkPromise.then((data) => ({ type: 'deeplink' as const, data })),
    ]);

    isComplete = true;

    if (winner.type === 'deeplink' && winner.data?.id_token) {
      try { await WebBrowser.dismissAuthSession(); } catch {}
      try { await WebBrowser.dismissBrowser(); } catch {}
      return {
        user: null,
        idToken: winner.data.id_token,
        email: winner.data.email || '',
        displayName: winner.data.name || '',
        photoURL: null,
        phoneNumber: null,
      };
    }

    if (winner.type === 'poll' && winner.data?.id_token) {
      try { await WebBrowser.dismissAuthSession(); } catch {}
      try { await WebBrowser.dismissBrowser(); } catch {}
      return {
        user: null,
        idToken: winner.data.id_token,
        email: winner.data.email || '',
        displayName: winner.data.name || '',
        photoURL: null,
        phoneNumber: null,
      };
    }

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

      // Check backend session once more in case browser closed right after auth
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
      } catch {}
    }

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
    (urlSubscription as { remove: () => void } | null)?.remove();
    try { await WebBrowser.dismissAuthSession(); } catch {}
    try { await WebBrowser.dismissBrowser(); } catch {}
  }
}

export { auth, GoogleAuthProvider };
