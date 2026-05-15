import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'customer', label: 'Customer', icon: '🛒', desc: 'Shop from nearby stores' },
  { value: 'shop_owner', label: 'Shop Owner', icon: '🏪', desc: 'Sell your products online' },
  { value: 'delivery_partner', label: 'Delivery Partner', icon: '🚴', desc: 'Deliver orders and earn' },
];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  async function handleRegister() {
    if (!name || !email || !phone || !password) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    if (phone.length < 10) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }
    setLoading(true);
    try {
      const data = await authService.register({ name, email: email.trim().toLowerCase(), phone, password, role });
      setAuth(data.user, data.access_token, data.refresh_token);
      const dest: Record<string, string> = {
        customer: '/(customer)',
        shop_owner: '/(shop)',
        delivery_partner: '/(delivery)',
      };
      router.replace((dest[data.user.role] ?? '/(auth)/login') as any);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Registration failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join MyKirana today</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                onPress={() => setRole(r.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Full Name" placeholder="Your name" value={name} onChangeText={setName} leftIcon="person-outline" />
          <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
          <Input label="Phone" placeholder="10-digit mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon="call-outline" maxLength={10} />
          <Input label="Password" placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry leftIcon="lock-closed-outline" />

          <Button title="Create Account" onPress={handleRegister} loading={loading} fullWidth style={styles.submitBtn} />
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flexGrow: 1 },
  header: { backgroundColor: Colors.primary, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { padding: 24 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  roleIcon: { fontSize: 24, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  roleLabelActive: { color: Colors.primary },
  roleDesc: { fontSize: 10, color: Colors.gray, textAlign: 'center', marginTop: 2 },
  submitBtn: { marginTop: 8 },
  linkRow: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: 14, color: Colors.textSecondary },
  link: { color: Colors.primary, fontWeight: '600' },
});
