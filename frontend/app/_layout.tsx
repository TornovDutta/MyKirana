import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import Toast from 'react-native-toast-message';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (Platform.OS !== 'web' && hasHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hasHydrated]);

  // Inject Google Fonts and global smooth web animation styles
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontLinkId = 'mykirana-google-fonts';
      if (!document.getElementById(fontLinkId)) {
        const link = document.createElement('link');
        link.id = fontLinkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
        document.head.appendChild(link);
      }

      const styleId = 'mykirana-web-global-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          * {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            box-sizing: border-box;
          }
          body {
            background-color: #F8FAFC;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          ::selection {
            background-color: #A7F3D0;
            color: #064E3B;
          }

          /* Keyframe animations */
          @keyframes subtleFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes gentlePulse {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.04); opacity: 1; }
          }
          @keyframes orbFloat1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(15px, -20px) scale(1.1); }
          }
          @keyframes orbFloat2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(-20px, 15px) scale(0.95); }
          }
          @keyframes shimmerGlow {
            0% { opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
          }

          /* Interactive smooth transitions */
          button, [role="button"] {
            transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, opacity 0.18s ease;
          }
          button:hover, [role="button"]:hover {
            transform: translateY(-1px);
          }
          button:active, [role="button"]:active {
            transform: translateY(1px) scale(0.99);
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </GestureHandlerRootView>
  );
}
