import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

type Step = 'phone' | 'otp';

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

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const { setAuth } = useAuthStore();

  async function handleSendOtp() {
    const trimmed = phone.trim();
    if (trimmed.length !== 10 || !/^\d+$/.test(trimmed)) {
      Toast.show({ type: 'error', text1: 'Enter a valid 10-digit mobile number' });
      return;
    }
    setLoading(true);
    try {
      const data = await authService.sendOtp(trimmed);
      setIsNewUser(data.is_new_user);
      setStep('otp');
      if (data.dev_otp) {
        Toast.show({ type: 'info', text1: `Dev OTP: ${data.dev_otp}`, visibilityTime: 8000 });
      } else {
        Toast.show({ type: 'success', text1: 'OTP sent to your mobile' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit OTP' });
      return;
    }
    if (isNewUser && !name.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your name' });
      return;
    }
    setLoading(true);
    try {
      const payload: { phone: string; otp: string; name?: string; role?: UserRole } = {
        phone: phone.trim(),
        otp: otpString,
      };
      if (isNewUser) {
        payload.name = name.trim();
        payload.role = role;
      }
      const data = await authService.verifyOtp(payload);
      setAuth(data.user, data.access_token, data.refresh_token);
      router.replace((DEST[data.user.role] ?? '/(auth)/login') as any);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Verification failed' });
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.logo}>MyKirana</Text>
          <Text style={styles.tagline}>Your neighbourhood, delivered</Text>
        </View>

        <View style={styles.form}>
          {step === 'phone' ? (
            <>
              <Text style={styles.title}>Enter your mobile number</Text>
              <Text style={styles.subtitle}>We'll send an OTP to verify your number</Text>
              <Input
                label="Mobile Number"
                placeholder="10-digit mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                leftIcon="call-outline"
              />
              <Button title="Send OTP" onPress={handleSendOtp} loading={loading} fullWidth style={styles.actionBtn} />
            </>
          ) : (
            <>
              <View style={styles.otpHeader}>
                <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}>
                  <Text style={styles.changePhone}>← {phone}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.title}>{isNewUser ? 'Create your account' : 'Welcome back!'}</Text>
              <Text style={styles.subtitle}>Enter the 6-digit OTP sent to +91 {phone}</Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { otpRefs.current[i] = ref; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {isNewUser && (
                <>
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
                  <Input
                    label="Full Name"
                    placeholder="Your name"
                    value={name}
                    onChangeText={setName}
                    leftIcon="person-outline"
                  />
                </>
              )}

              <Button
                title={isNewUser ? 'Create Account' : 'Verify & Login'}
                onPress={handleVerifyOtp}
                loading={loading}
                fullWidth
                style={styles.actionBtn}
              />
              <TouchableOpacity onPress={handleSendOtp} style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive OTP? <Text style={styles.resendLink}>Resend</Text></Text>
              </TouchableOpacity>
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
  form: { padding: 24, paddingTop: 32 },
  otpHeader: { marginBottom: 8 },
  changePhone: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  actionBtn: { marginTop: 8 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  otpBoxFilled: { borderColor: Colors.primary },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
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
  resendRow: { alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: Colors.textSecondary },
  resendLink: { color: Colors.primary, fontWeight: '600' },
});
