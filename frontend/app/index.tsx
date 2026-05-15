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

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  if (!accessToken) return <Redirect href="/(auth)/login" />;

  const dest = user?.role ? ROLE_ROUTES[user.role] : null;
  return <Redirect href={(dest ?? '/(auth)/login') as any} />;
}
