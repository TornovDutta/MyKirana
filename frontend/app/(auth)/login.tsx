import React, { useReducer } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

type Mode = 'login' | 'register';

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'customer', label: 'Customer', icon: '🛒', desc: 'Shop from nearby stores' },
  { value: 'shop_owner', label: 'Shop Owner', icon: '🏪', desc: 'Sell your products online' },
  { value: 'delivery_partner', label: 'Delivery Partner', icon: '🚴', desc: 'Deliver orders and earn' },
];

const DEST: Record<string, string> = {
  customer: '/(customer)',
  shop_owner: '/(shop)',
  delivery_partner: '/(delivery)',
};

interface LoginState { mode: Mode; name: string; email: string; password: string; confirmPassword: string; role: UserRole; loading: boolean; }
const LOGIN_INIT: LoginState = { mode: 'login', name: '', email: '', password: '', confirmPassword: '', role: 'customer', loading: false };
type LoginAction =
  | { type: 'switch_mode'; value: Mode }
  | { type: 'set_name'; value: string }
  | { type: 'set_email'; value: string }
  | { type: 'set_password'; value: string }
  | { type: 'set_confirm_password'; value: string }
  | { type: 'set_role'; value: UserRole }
  | { type: 'set_loading'; value: boolean };
function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'switch_mode': return { ...LOGIN_INIT, mode: action.value };
    case 'set_name': return { ...state, name: action.value };
    case 'set_email': return { ...state, email: action.value };
    case 'set_password': return { ...state, password: action.value };
    case 'set_confirm_password': return { ...state, confirmPassword: action.value };
    case 'set_role': return { ...state, role: action.value };
    case 'set_loading': return { ...state, loading: action.value };
  }
}

export default function LoginScreen() {
  const [state, dispatch] = useReducer(loginReducer, LOGIN_INIT);
  const { mode, name, email, password, confirmPassword, role, loading } = state;
  const { setAuth } = useAuthStore();

  function switchMode(m: Mode) {
    dispatch({ type: 'switch_mode', value: m });
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Enter your email and password' });
      return;
    }
    dispatch({ type: 'set_loading', value: true });
    try {
      const data = await authService.login({ email: email.trim().toLowerCase(), password });
      setAuth(data.user, data.access_token, data.refresh_token);
      router.replace((DEST[data.user.role] ?? '/(auth)/login') as any);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Login failed' });
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }

  async function handleRegister() {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your full name' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Enter a valid email address' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    dispatch({ type: 'set_loading', value: true });
    try {
      const data = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      setAuth(data.user, data.access_token, data.refresh_token);
      router.replace((DEST[data.user.role] ?? '/(auth)/login') as any);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Registration failed' });
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.logo}>MyKirana</Text>
          <Text style={styles.tagline}>Your neighbourhood, delivered</Text>
        </View>

        {/* Mode tabs */}
        <View style={styles.tabRow}>
          <Pressable
            style={({ pressed }) => [styles.tab, mode === 'login' && styles.tabActive, pressed && { opacity: 0.8 }]}
            onPress={() => switchMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Login</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.tab, mode === 'register' && styles.tabActive, pressed && { opacity: 0.8 }]}
            onPress={() => switchMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Create Account</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {mode === 'login' ? (
            <>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(v) => dispatch({ type: 'set_email', value: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />
              <Input
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={(v) => dispatch({ type: 'set_password', value: v })}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Button title="Login" onPress={handleLogin} loading={loading} fullWidth style={styles.actionBtn} />

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  New to MyKirana?{' '}
                  <Text style={styles.switchLink} onPress={() => switchMode('register')}>Create Account</Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Join MyKirana today</Text>

              <Text style={styles.sectionLabel}>I want to join as...</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.value}
                    style={({ pressed }) => [styles.roleCard, role === r.value && styles.roleCardActive, pressed && { opacity: 0.8 }]}
                    onPress={() => dispatch({ type: 'set_role', value: r.value })}
                  >
                    <Text style={styles.roleIcon}>{r.icon}</Text>
                    <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Full Name"
                placeholder="Your full name"
                value={name}
                onChangeText={(v) => dispatch({ type: 'set_name', value: v })}
                leftIcon="person-outline"
              />
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(v) => dispatch({ type: 'set_email', value: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />
              <Input
                label="Password"
                placeholder="Min. 6 characters"
                value={password}
                onChangeText={(v) => dispatch({ type: 'set_password', value: v })}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(v) => dispatch({ type: 'set_confirm_password', value: v })}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Button title="Create Account" onPress={handleRegister} loading={loading} fullWidth style={styles.actionBtn} />

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  Already have an account?{' '}
                  <Text style={styles.switchLink} onPress={() => switchMode('login')}>Login</Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flexGrow: 1 },
  hero: { backgroundColor: Colors.primary, padding: 40, paddingTop: 80, alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

  tabRow: {
    flexDirection: 'row',
    margin: 20,
    marginBottom: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: {
    backgroundColor: Colors.white,
    boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },

  form: { padding: 24, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  actionBtn: { marginTop: 8 },

  sectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  roleGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  roleIcon: { fontSize: 26, marginBottom: 6 },
  roleLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  roleLabelActive: { color: Colors.primary },
  roleDesc: { fontSize: 10, color: Colors.gray, textAlign: 'center', marginTop: 3 },

  switchRow: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { color: Colors.primary, fontWeight: '600' },
});
