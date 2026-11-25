import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../services/auth';
import { loginWithGoogle } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'customer', label: 'Customer', icon: '🛒', desc: 'Shop from nearby local stores' },
  { value: 'shop_owner', label: 'Shop Owner', icon: '🏪', desc: 'Manage catalog & sell online' },
  { value: 'delivery_partner', label: 'Delivery Partner', icon: '🚴', desc: 'Deliver orders & earn flexibly' },
];

const DEST: Record<string, string> = {
  customer: '/(customer)',
  shop_owner: '/(shop)',
  delivery_partner: '/(delivery)',
};

export default function LoginScreen() {
  const [mode, setMode] = useState<'google_signin' | 'profile_setup'>('google_signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, accessToken, setAuth } = useAuthStore();

  // Animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-24)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const googleBtnScale = useRef(new Animated.Value(1)).current;

  // Staggered entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 650,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation for hero icon
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // Subtle pulse for live delivery badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Automatically redirect as soon as user authentication is confirmed
  useEffect(() => {
    if (accessToken && user?.role) {
      const dest = DEST[user.role] ?? '/(customer)';
      router.replace(dest as any);
    }
  }, [accessToken, user]);

  async function handleGoogleLogin() {
    // Micro-interaction bounce
    Animated.sequence([
      Animated.timing(googleBtnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.spring(googleBtnScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    setGoogleLoading(true);
    try {
      const gResult = await loginWithGoogle();
      setFirebaseIdToken(gResult.idToken);
      if (gResult.displayName) {
        setName(gResult.displayName);
      }
      if (gResult.email) {
        setEmail(gResult.email);
      }

      // Check with backend if profile exists
      const res = await authService.firebaseLogin({
        id_token: gResult.idToken,
      });

      if (res.needs_profile) {
        if (res.name && !name) {
          setName(res.name);
        }
        setMode('profile_setup');
        Toast.show({
          type: 'info',
          text1: 'Google Sign-In Successful!',
          text2: 'Please enter your username and phone number to continue.',
        });
      } else {
        setAuth(res.user, res.access_token, res.refresh_token);
        Toast.show({ type: 'success', text1: `Welcome back, ${res.user.name || 'User'}!` });
        router.replace((DEST[res.user.role] ?? '/(customer)') as any);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        Toast.show({ type: 'info', text1: 'Google sign-in was cancelled' });
      } else {
        const msg = err.response?.data?.detail || err.message || 'Google sign-in failed';
        Toast.show({ type: 'error', text1: msg });
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleCompleteProfile() {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your username / full name' });
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Toast.show({ type: 'error', text1: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setLoading(true);
    try {
      const res = await authService.firebaseLogin({
        id_token: firebaseIdToken,
        name: name.trim(),
        phone_number: cleanPhone,
        role,
      });

      setAuth(res.user, res.access_token, res.refresh_token);
      Toast.show({ type: 'success', text1: 'Account setup complete!' });
      router.replace((DEST[res.user.role] ?? '/(customer)') as any);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.detail ?? 'Failed to complete profile',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Ambient background decoration */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.wrapper}>
          {/* Animated Hero Header */}
          <Animated.View
            style={[
              styles.heroContainer,
              {
                opacity: heroFade,
                transform: [{ translateY: heroSlide }],
              },
            ]}
          >
            {/* Live Badge */}
            <View style={styles.liveBadge}>
              <Animated.View
                style={[
                  styles.pulseDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={styles.liveBadgeText}>10-Minute Hyperlocal Delivery</Text>
            </View>

            {/* Brand Logo & Tagline */}
            <View style={styles.brandRow}>
              <Animated.View
                style={[
                  styles.floatingIconBadge,
                  {
                    transform: [{ translateY: floatAnim }],
                  },
                ]}
              >
                <Ionicons name="basket" size={32} color={Colors.white} />
              </Animated.View>
              <Text style={styles.brandTitle}>MyKirana</Text>
            </View>

            <Text style={styles.brandTagline}>
              Fresh groceries & daily essentials from your trusted neighbourhood stores
            </Text>
          </Animated.View>

          {/* Animated Main Action Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardFade,
                transform: [{ translateY: cardSlide }, { scale: cardScale }],
              },
            ]}
          >
            {mode === 'google_signin' ? (
              <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="sparkles" size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.welcomeHeading}>Get Started</Text>
                  <Text style={styles.welcomeSubtext}>
                    Join thousands getting instant doorstep delivery in your neighbourhood.
                  </Text>
                </View>

                {/* Google Sign-In Button */}
                <Animated.View style={{ transform: [{ scale: googleBtnScale }] }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.googleBtn,
                      pressed && styles.googleBtnPressed,
                      googleLoading && styles.googleBtnDisabled,
                    ]}
                    onPress={handleGoogleLogin}
                    disabled={googleLoading}
                  >
                    <View style={styles.googleIconContainer}>
                      <Ionicons name="logo-google" size={22} color="#EA4335" />
                    </View>
                    <Text style={styles.googleBtnText}>
                      {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} style={{ marginLeft: 8 }} />
                  </Pressable>
                </Animated.View>

                {/* Trust and Feature Bullets */}
                <View style={styles.featuresRow}>
                  <View style={styles.featureItem}>
                    <Ionicons name="flash-outline" size={16} color={Colors.primary} />
                    <Text style={styles.featureText}>Instant Checkout</Text>
                  </View>
                  <View style={styles.featureDivider} />
                  <View style={styles.featureItem}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
                    <Text style={styles.featureText}>100% Secure</Text>
                  </View>
                  <View style={styles.featureDivider} />
                  <View style={styles.featureItem}>
                    <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
                    <Text style={styles.featureText}>Local Prices</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-outline" size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.welcomeHeading}>Complete Your Profile</Text>
                  <Text style={styles.welcomeSubtext}>
                    {email ? `Signed in as ${email}` : 'Enter your name and mobile number to continue.'}
                  </Text>
                </View>

                <Text style={styles.roleSectionTitle}>Choose how you want to use MyKirana</Text>
                <View style={styles.rolesContainer}>
                  {ROLES.map((r) => {
                    const isSelected = role === r.value;
                    return (
                      <Pressable
                        key={r.value}
                        style={({ pressed }) => [
                          styles.roleCard,
                          isSelected && styles.roleCardSelected,
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => setRole(r.value)}
                      >
                        <Text style={styles.roleCardIcon}>{r.icon}</Text>
                        <View style={styles.roleCardContent}>
                          <Text style={[styles.roleCardLabel, isSelected && styles.roleCardLabelSelected]}>
                            {r.label}
                          </Text>
                          <Text style={styles.roleCardDesc}>{r.desc}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <Input
                  label="Username / Full Name"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChangeText={setName}
                  leftIcon="person-outline"
                />

                <Input
                  label="Phone Number"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                  maxLength={10}
                />

                <Button
                  title="Complete Setup & Enter"
                  onPress={handleCompleteProfile}
                  loading={loading}
                  fullWidth
                  style={styles.submitButton}
                />

                <Pressable
                  style={styles.backButton}
                  onPress={() => setMode('google_signin')}
                >
                  <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service & Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -120,
    left: '10%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(70px)' } : {}),
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -100,
    right: '10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    ...(Platform.OS === 'web' ? { filter: 'blur(60px)' } : {}),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  wrapper: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  floatingIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  brandTagline: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
    maxWidth: 380,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    padding: 28,
  },
  cardInner: {
    width: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  welcomeHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  googleBtnPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#94A3B8',
  },
  googleBtnDisabled: {
    opacity: 0.7,
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.1,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  featureDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  roleSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  rolesContainer: {
    gap: 10,
    marginBottom: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  roleCardIcon: {
    fontSize: 26,
  },
  roleCardContent: {
    flex: 1,
  },
  roleCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleCardLabelSelected: {
    color: Colors.primary,
  },
  roleCardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  submitButton: {
    marginTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
