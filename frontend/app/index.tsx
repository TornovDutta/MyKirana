import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import Colors from '../constants/colors';

const ROLE_ROUTES: Record<string, string> = {
  customer: '/(customer)',
  shop_owner: '/(shop)',
  delivery_partner: '/(delivery)',
};

export default function Index() {
  const { user, accessToken, hasHydrated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!hasHydrated && !ready) {
    return (
      <View style={{ flex: 1, minHeight: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!accessToken) {
    return <Redirect href="/login" />;
  }

  const dest = user?.role ? ROLE_ROUTES[user.role] : null;
  return <Redirect href={(dest ?? '/login') as any} />;
}
