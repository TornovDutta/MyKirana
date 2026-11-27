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
            background-color: #DDD6FE;
            color: #4C1D95;
          }

          /* Custom sleek scrollbar on web */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #F1F5F9;
          }
          ::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 9999px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #8B5CF6;
          }

          /* Keyframe animations */
          @keyframes subtleFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes gentlePulse {
            0%, 100% { transform: scale(1); opacity: 0.92; }
            50% { transform: scale(1.06); opacity: 1; }
          }
          @keyframes orbFloat1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(24px, -24px) scale(1.12); }
          }
          @keyframes orbFloat2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(-24px, 18px) scale(0.94); }
          }
          @keyframes shimmerGlow {
            0% { opacity: 0.4; }
            50% { opacity: 0.85; }
            100% { opacity: 0.4; }
          }

          /* Interactive smooth transitions */
          button, [role="button"] {
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
          }
          button:hover, [role="button"]:hover {
            transform: translateY(-2px);
          }
          button:active, [role="button"]:active {
            transform: translateY(1px) scale(0.98);
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
