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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { authService } from '../../services/auth';
import { loginWithGoogle } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Colors from '../../constants/colors';

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

const FLOATING_CHIPS = [
  { icon: '🥬', label: 'Fresh Veggies' },
  { icon: '🥛', label: 'Daily Dairy' },
  { icon: '🥖', label: 'Warm Bakery' },
  { icon: '⚡', label: '10-Min Drop' },
];

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 860;

  const params = useLocalSearchParams<{
    id_token?: string;
    email?: string;
    name?: string;
  }>();

  const [mode, setMode] = useState<'google_signin' | 'profile_setup'>('google_signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, accessToken, setAuth } = useAuthStore();
  const processedDeepLinkToken = useRef<string | null>(null);

  // Animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(-24)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(36)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const googleBtnScale = useRef(new Animated.Value(1)).current;

  // Staggered entrance & continuous floating animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(heroSlide, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 650,
        delay: 160,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0,
        friction: 8,
        tension: 42,
        delay: 160,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 42,
        delay: 160,
        useNativeDriver: true,
      }),
    ]).start();

    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(floatA, { toValue: -9, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatA, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(floatB, { toValue: 8, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatB, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 950, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    );

    loopA.start();
    loopB.start();
    pulseLoop.start();

    return () => {
      loopA.stop();
      loopB.stop();
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

  // Handle deep-link return directly if OS reopened /login?id_token=...
  useEffect(() => {
    const token = params.id_token;
    if (token && processedDeepLinkToken.current !== token && !accessToken) {
      processedDeepLinkToken.current = token;
      processFirebaseToken(token, params.name || '', params.email || '');
    }
  }, [params.id_token, accessToken]);

  async function processFirebaseToken(idToken: string, displayName: string, userEmail: string) {
    setGoogleLoading(true);
    try {
      setFirebaseIdToken(idToken);
      if (displayName) setName(displayName);
      if (userEmail) setEmail(userEmail);

      const res = await authService.firebaseLogin({ id_token: idToken });

      if (res.needs_profile) {
        if (res.name && !displayName) {
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
      const msg = err.response?.data?.detail || err.message || 'Google sign-in failed';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleGoogleLogin() {
    Animated.sequence([
      Animated.timing(googleBtnScale, { toValue: 0.96, duration: 90, useNativeDriver: true }),
      Animated.spring(googleBtnScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    setGoogleLoading(true);
    try {
      const gResult = await loginWithGoogle();
      await processFirebaseToken(
        gResult.idToken,
        gResult.displayName || '',
        gResult.email || ''
      );
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        Toast.show({ type: 'info', text1: 'Google sign-in was cancelled' });
      } else {
        const msg = err.response?.data?.detail || err.message || 'Google sign-in failed';
        Toast.show({ type: 'error', text1: msg });
      }
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
      {/* Ambient Animated Background Orbs */}
      <View style={styles.ambientGlowViolet} />
      <View style={styles.ambientGlowCoral} />
      <View style={styles.ambientGlowIndigo} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isWideWeb && styles.scrollContentWide]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainContainer, isWideWeb && styles.mainContainerWide]}>
          {/* Left / Top Hero Showcase */}
          <Animated.View
            style={[
              styles.heroColumn,
              isWideWeb && styles.heroColumnWide,
              {
                opacity: heroFade,
                transform: [{ translateY: heroSlide }],
              },
            ]}
          >
            {/* Live Express Badge */}
            <View style={styles.liveBadge}>
              <Animated.View
                style={[
                  styles.pulseDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.liveBadgeText}>Express 10-Min Neighbourhood Delivery</Text>
            </View>

            {/* Brand Row */}
            <View style={[styles.brandRow, isWideWeb && styles.brandRowWide]}>
              <Animated.View
                style={[
                  styles.floatingIconBadge,
                  { transform: [{ translateY: floatA }] },
                ]}
              >
                <Ionicons name="bag-handle" size={30} color={Colors.white} />
              </Animated.View>
              <Text style={styles.brandTitle}>MyKirana</Text>
            </View>

            <Text style={[styles.heroHeadline, isWideWeb && styles.heroHeadlineWide]}>
              Your local stores,{' '}
              <Text style={styles.heroHeadlineAccent}>delivered faster.</Text>
            </Text>

            <Text style={[styles.brandTagline, isWideWeb && styles.brandTaglineWide]}>
              Order fresh produce, dairy, snacks, and daily essentials directly from trusted kiranas around the corner.
            </Text>

            {/* Floating Category Pills */}
            <View style={[styles.floatingChipsRow, isWideWeb && styles.floatingChipsRowWide]}>
              {FLOATING_CHIPS.map((chip, idx) => (
                <Animated.View
                  key={chip.label}
                  style={[
                    styles.floatingChip,
                    {
                      transform: [{ translateY: idx % 2 === 0 ? floatA : floatB }],
                    },
                  ]}
                >
                  <Text style={styles.floatingChipIcon}>{chip.icon}</Text>
                  <Text style={styles.floatingChipLabel}>{chip.label}</Text>
                </Animated.View>
              ))}
            </View>

            {/* Metrics Strip on Wide Web */}
            {isWideWeb && (
              <View style={styles.statsStrip}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>10 min</Text>
                  <Text style={styles.statLabel}>Avg. Delivery</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>500+</Text>
                  <Text style={styles.statLabel}>Local Stores</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>4.9 ★</Text>
                  <Text style={styles.statLabel}>Customer Rating</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Right / Bottom Sign-In Card */}
          <Animated.View
            style={[
              styles.cardColumn,
              isWideWeb && styles.cardColumnWide,
              {
                opacity: cardFade,
                transform: [{ translateY: cardSlide }, { scale: cardScale }],
              },
            ]}
          >
            <View style={styles.card}>
              {mode === 'google_signin' ? (
                <View style={styles.cardInner}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="sparkles" size={26} color={Colors.primary} />
                    </View>
                    <Text style={styles.welcomeHeading}>Welcome Back</Text>
                    <Text style={styles.welcomeSubtext}>
                      Sign in with one click to browse shops and track live deliveries.
                    </Text>
                  </View>

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
                        <Ionicons name="logo-google" size={21} color="#EA4335" />
                      </View>
                      <Text style={styles.googleBtnText}>
                        {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={Colors.primary}
                        style={{ marginLeft: 8 }}
                      />
                    </Pressable>
                  </Animated.View>

                  {/* Trust Indicators */}
                  <View style={styles.featuresRow}>
                    <View style={styles.featureItem}>
                      <Ionicons name="flash-outline" size={15} color={Colors.secondary} />
                      <Text style={styles.featureText}>1-Tap Login</Text>
                    </View>
                    <View style={styles.featureDivider} />
                    <View style={styles.featureItem}>
                      <Ionicons name="shield-checkmark-outline" size={15} color={Colors.primary} />
                      <Text style={styles.featureText}>Verified Shops</Text>
                    </View>
                    <View style={styles.featureDivider} />
                    <View style={styles.featureItem}>
                      <Ionicons name="pricetag-outline" size={15} color={Colors.secondary} />
                      <Text style={styles.featureText}>Best Prices</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.cardInner}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="person-outline" size={26} color={Colors.primary} />
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
                            <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
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
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing in, you agree to our Terms of Service & Privacy Policy
              </Text>
            </View>
          </Animated.View>
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
  ambientGlowViolet: {
    position: 'absolute',
    top: -130,
    left: '-8%',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(109, 40, 217, 0.14)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  ambientGlowCoral: {
    position: 'absolute',
    bottom: -110,
    right: '-5%',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(75px)' } : {}),
  },
  ambientGlowIndigo: {
    position: 'absolute',
    top: '35%',
    right: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    ...(Platform.OS === 'web' ? { filter: 'blur(70px)' } : {}),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 18,
  },
  scrollContentWide: {
    paddingHorizontal: 48,
    paddingVertical: 48,
  },
  mainContainer: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    gap: 24,
  },
  mainContainerWide: {
    maxWidth: 1080,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 56,
  },
  heroColumn: {
    alignItems: 'center',
    width: '100%',
  },
  heroColumnWide: {
    flex: 1.15,
    alignItems: 'flex-start',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primarySubtle,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 18,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 12,
  },
  brandRowWide: {
    justifyContent: 'flex-start',
  },
  floatingIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroHeadlineWide: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'left',
    marginBottom: 14,
  },
  heroHeadlineAccent: {
    color: Colors.primary,
  },
  brandTagline: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 12,
    maxWidth: 400,
  },
  brandTaglineWide: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    paddingHorizontal: 0,
    maxWidth: 480,
  },
  floatingChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
  },
  floatingChipsRowWide: {
    justifyContent: 'flex-start',
    marginTop: 28,
  },
  floatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    elevation: 2,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  floatingChipIcon: {
    fontSize: 15,
  },
  floatingChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginTop: 32,
    gap: 24,
  },
  statBox: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  cardColumn: {
    width: '100%',
    alignItems: 'center',
  },
  cardColumnWide: {
    flex: 0.9,
    maxWidth: 440,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    elevation: 8,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
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
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  welcomeHeading: {
    fontSize: 23,
    fontWeight: '800',
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
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  googleBtnPressed: {
    backgroundColor: '#F5F3FF',
    borderColor: Colors.primaryLight,
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
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    borderRadius: 16,
    padding: 13,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
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
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
