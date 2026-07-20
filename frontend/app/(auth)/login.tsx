import React, { useState, useEffect, useRef } from 'react';
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
import { auth } from '../../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

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

type Step = 'phone' | 'otp' | 'profile';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [role, setRole] = useState<UserRole>('customer');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const { setAuth } = useAuthStore();
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize RecaptchaVerifier for web
    if (Platform.OS === 'web' && !recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, []);

  async function handleSendOTP() {
    if (!phone.trim() || phone.length < 10) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`; // Assuming India as default
      
      let appVerifier = recaptchaVerifier.current;
      if (!appVerifier) {
        if (Platform.OS !== 'web') {
           // Provide a descriptive error for native environments where standard RecaptchaVerifier is unsupported without extra setup
           console.warn("Recaptcha is not supported natively in this setup.");
           Toast.show({ type: 'error', text1: 'Phone auth requires Web or native configuration' });
           setLoading(false);
           return;
        } else {
           appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
           recaptchaVerifier.current = appVerifier;
        }
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier as any);
      setConfirmationResult(confirmation);
      setStep('otp');
      Toast.show({ type: 'success', text1: 'OTP sent successfully' });
    } catch (err: any) {
      console.error(err);
      Toast.show({ type: 'error', text1: err.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otp.trim() || otp.length < 6) {
      Toast.show({ type: 'error', text1: 'Enter a valid OTP' });
      return;
    }

    if (!confirmationResult) {
      Toast.show({ type: 'error', text1: 'Please request OTP again' });
      setStep('phone');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      
      // Call backend to authenticate
      const data = await authService.firebaseLogin({
        id_token: idToken,
        role: role
      });
      
      setAuth(data.user, data.access_token, data.refresh_token);

      if (!data.user.name || !data.user.email) {
        // New user or incomplete profile
        setStep('profile');
      } else {
        // Profile complete, navigate home
        Toast.show({ type: 'success', text1: 'Login successful' });
        router.replace((DEST[data.user.role] ?? '/(auth)/login') as any);
      }
    } catch (err: any) {
      console.error(err);
      Toast.show({ type: 'error', text1: err.response?.data?.detail || err.message || 'OTP Verification failed' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your full name' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      
      const { user, accessToken, refreshToken } = useAuthStore.getState();
      if (user) {
        setAuth({ ...user, name: updatedUser.name || name.trim(), email: updatedUser.email || email.trim() }, accessToken!, refreshToken!);
        Toast.show({ type: 'success', text1: 'Profile created successfully' });
        router.replace((DEST[user.role] ?? '/(auth)/login') as any);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to update profile' });
    } finally {
      setLoading(false);
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
          {step === 'phone' && (
            <>
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>Login or create an account</Text>

              <Text style={styles.sectionLabel}>Continue as...</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.value}
                    style={({ pressed }) => [styles.roleCard, role === r.value && styles.roleCardActive, pressed && { opacity: 0.8 }]}
                    onPress={() => setRole(r.value)}
                  >
                    <Text style={styles.roleIcon}>{r.icon}</Text>
                    <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.desc}</Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Phone Number"
                placeholder="10-digit mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />

              <Button title="Send OTP" onPress={handleSendOTP} loading={loading} fullWidth style={styles.actionBtn} />
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>Enter the OTP sent to {phone}</Text>

              <Input
                label="One Time Password"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                leftIcon="key-outline"
                maxLength={6}
              />

              <Button title="Verify & Login" onPress={handleVerifyOTP} loading={loading} fullWidth style={styles.actionBtn} />
              
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>
                  Didn't receive code?{' '}
                  <Text style={styles.switchLink} onPress={handleSendOTP}>Resend</Text>
                </Text>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLink} onPress={() => setStep('phone')}>Change Phone Number</Text>
              </View>
            </>
          )}

          {step === 'profile' && (
            <>
              <Text style={styles.title}>Complete Profile</Text>
              <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

              <Input
                label="Full Name"
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                leftIcon="person-outline"
              />
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <Button title="Save & Continue" onPress={handleCompleteProfile} loading={loading} fullWidth style={styles.actionBtn} />
            </>
          )}
        </View>
        
        {/* Invisible ReCaptcha container for Firebase Web */}
        <View nativeID="recaptcha-container" />
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

  form: { padding: 24, paddingTop: 30 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  actionBtn: { marginTop: 16 },

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
